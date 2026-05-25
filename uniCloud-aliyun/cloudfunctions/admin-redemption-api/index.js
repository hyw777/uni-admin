'use strict';
const uniID = require('uni-id-common');

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const dbCmd = db.command;

  const uniIDIns = uniID.createInstance({ context });
  const payload = await uniIDIns.checkToken(event.uniIdToken);
  const uid = payload.uid || 'test_admin';

  const roles = payload.role || [];
  const isAdmin = roles.includes('admin');
  const isOperator = roles.includes('operator');

  if (!isAdmin && !isOperator) {
    return { errCode: 403, errMsg: '无权访问，请联系管理员' };
  }

  const { action, params } = event;

  try {

  switch (action) {

    case 'list': {
      const { status, store_id, keyword, page = 1, pageSize = 20, orderBy = 'create_date desc' } = params || {};

      let where = {};
      if (status && status !== 'all') {
        where.status = status;
      }
      if (store_id) {
        where.store_id = store_id;
      }
      if (keyword) {
        const re = new RegExp(keyword, 'i');
        where.code = re;
      }

      const skip = (page - 1) * pageSize;
      const [dataResult, countResult] = await Promise.all([
        db.collection('redemption_code')
          .where(where)
          .orderBy(...orderBy.split(' '))
          .skip(skip)
          .limit(pageSize)
          .get(),
        db.collection('redemption_code').where(where).count()
      ]);

      const records = (dataResult.result && dataResult.result.data) ? dataResult.result.data : [];
      const total = (countResult.result && typeof countResult.result.total === 'number') ? countResult.result.total : 0;

      const orderIds = records.map(r => r.order_id).filter(Boolean);
      const orderMap = {};
      if (orderIds.length) {
        const orderRes = await db.collection('order')
          .where({ _id: dbCmd.in(orderIds) })
          .field({ _id: true, user_id: true, total_fee: true, items: true, order_type: true, order_no: true })
          .get();
        const orders = (orderRes.result && orderRes.result.data) ? orderRes.result.data : [];
        orders.forEach(o => { orderMap[o._id] = o; });
      }

      const userIds = [...new Set(Object.values(orderMap).map(o => o.user_id).filter(Boolean))];
      const userMap = {};
      if (userIds.length) {
        const userRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(userIds) })
          .field({ _id: true, nickname: true, mobile: true })
          .get();
        const users = (userRes.result && userRes.result.data) ? userRes.result.data : [];
        users.forEach(u => { userMap[u._id] = u; });
      }

      const usedByIds = [...new Set(records.map(r => r.used_by).filter(Boolean))];
      const usedByMap = {};
      if (usedByIds.length) {
        const usedByRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(usedByIds) })
          .field({ _id: true, nickname: true })
          .get();
        const usedByUsers = (usedByRes.result && usedByRes.result.data) ? usedByRes.result.data : [];
        usedByUsers.forEach(u => { usedByMap[u._id] = u; });
      }

      const enriched = records.map(r => {
        const order = orderMap[r.order_id] || {};
        const user = userMap[order.user_id] || {};
        const usedByUser = usedByMap[r.used_by] || {};
        return {
          ...r,
          order_no: order.order_no || '',
          order_total_fee: order.total_fee || 0,
          order_type: order.order_type || '',
          goods_title: order.items?.[0]?.title || '',
          user_nickname: user.nickname || '未知用户',
          user_mobile: user.mobile || '',
          used_by_nickname: usedByUser.nickname || '—'
        };
      });

      return {
        errCode: 0,
        data: {
          list: enriched,
          total,
          page,
          pageSize
        }
      };
    }

    case 'detail': {
      const { id } = params;
      if (!id) return { errCode: 1, errMsg: '缺少核销码ID' };

      const detailRes = await db.collection('redemption_code').doc(id).get();
      const data = (detailRes.result && detailRes.result.data) ? detailRes.result.data : [];
      if (!data || data.length === 0) return { errCode: 2, errMsg: '核销码不存在' };

      const record = data[0];

      let orderInfo = {};
      if (record.order_id) {
        const orderRes = await db.collection('order')
          .where({ _id: record.order_id })
          .field({ _id: true, order_no: true, user_id: true, total_fee: true, items: true, order_type: true, status: true, address: true, create_date: true })
          .get();
        const orders = (orderRes.result && orderRes.result.data) ? orderRes.result.data : [];
        if (orders.length > 0) orderInfo = orders[0];
      }

      let userInfo = {};
      if (orderInfo.user_id) {
        const userRes = await db.collection('uni-id-users')
          .doc(orderInfo.user_id)
          .field({ nickname: true, mobile: true })
          .get();
        const users = (userRes.result && userRes.result.data) ? userRes.result.data : [];
        if (users.length > 0) userInfo = users[0];
      }

      let usedByInfo = {};
      if (record.used_by) {
        const usedByRes = await db.collection('uni-id-users')
          .doc(record.used_by)
          .field({ nickname: true, mobile: true })
          .get();
        const users = (usedByRes.result && usedByRes.data) ? usedByRes.result.data : [];
        if (users.length > 0) usedByInfo = users[0];
      }

      let storeInfo = {};
      if (record.store_id) {
        const storeRes = await db.collection('store')
          .doc(record.store_id)
          .field({ name: true, address: true, mobile: true })
          .get();
        const stores = (storeRes.result && storeRes.result.data) ? storeRes.result.data : [];
        if (stores.length > 0) storeInfo = stores[0];
      }

      return {
        errCode: 0,
        data: {
          ...record,
          orderInfo,
          userInfo,
          usedByInfo,
          storeInfo
        }
      };
    }

    case 'invalidate': {
      const { id, reason = '管理员手动作废' } = params;
      if (!id) return { errCode: 1, errMsg: '缺少核销码ID' };

      const invRes = await db.collection('redemption_code').doc(id).get();
      const invData = (invRes.result && invRes.result.data) ? invRes.result.data : [];
      if (!invData || invData.length === 0) return { errCode: 2, errMsg: '核销码不存在' };

      const record = invData[0];
      if (record.status === 'used') return { errCode: 3, errMsg: '已使用的核销码无法作废' };
      if (record.status === 'expired') return { errCode: 4, errMsg: '该核销码已作废' };

      await db.collection('redemption_code').doc(id).update({
        status: 'expired',
        expired_reason: reason,
        expired_time: Date.now(),
        expired_by: uid
      });

      return { errCode: 0, errMsg: '核销码已作废' };
    }

    case 'forceVerify': {
      const { id } = params;
      if (!id) return { errCode: 1, errMsg: '缺少核销码ID' };

      const fvRes = await db.collection('redemption_code').doc(id).get();
      const fvData = (fvRes.result && fvRes.result.data) ? fvRes.result.data : [];
      if (!fvData || fvData.length === 0) return { errCode: 2, errMsg: '核销码不存在' };

      const record = fvData[0];
      if (record.status === 'used') return { errCode: 3, errMsg: '该核销码已核销' };

      const now = Date.now();
      const currentVersion = record.version || 0;
      const updateRes = await db.collection('redemption_code')
        .where({ _id: id, version: currentVersion })
        .update({
          status: 'used',
          used_time: now,
          used_by: uid,
          force_verified: true,
          version: dbCmd.inc(1)
        });

      if (updateRes.updated === 0) {
        return { errCode: 5, errMsg: '并发冲突，请重试' };
      }

      return { errCode: 0, errMsg: '强制核销成功', data: { order_id: record.order_id } };
    }

    case 'extend': {
      const { id, days } = params;
      if (!id) return { errCode: 1, errMsg: '缺少核销码ID' };
      if (!days || days < 1) return { errCode: 2, errMsg: '天数必须大于0' };

      const extRes = await db.collection('redemption_code').doc(id).get();
      const extData = (extRes.result && extRes.result.data) ? extRes.result.data : [];
      if (!extData || extData.length === 0) return { errCode: 3, errMsg: '核销码不存在' };

      const record = extData[0];
      const currentEnd = record.valid_end_time || Date.now();
      const newEnd = currentEnd + days * 24 * 60 * 60 * 1000;

      await db.collection('redemption_code').doc(id).update({
        valid_end_time: newEnd,
        extended_by: uid,
        extended_time: Date.now()
      });

      return { errCode: 0, errMsg: '有效期已延长', data: { new_end_time: newEnd } };
    }

    case 'statistics': {
      const { store_id } = params || {};

      const todayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
      const monthStartObj = new Date();
      monthStartObj.setDate(1);
      monthStartObj.setHours(0, 0, 0, 0);
      const monthStart = monthStartObj.getTime();

      let whereBase = {};
      if (store_id) whereBase.store_id = store_id;

      const [totalCount, usedCount, unusedCount, validCount] = await Promise.all([
        db.collection('redemption_code').where(whereBase).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'used' }).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'unused' }).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'valid' }).count()
      ]);

      const [todayUsed, weekUsed, monthUsed] = await Promise.all([
        db.collection('redemption_code').where({ ...whereBase, status: 'used', used_time: dbCmd.gte(todayStart) }).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'used', used_time: dbCmd.gte(weekStart) }).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'used', used_time: dbCmd.gte(monthStart) }).count()
      ]);

      const storeRankingRaw = await db.collection('redemption_code')
        .aggregate()
        .match({ ...whereBase, status: 'used' })
        .group({ _id: '$store_id', count: { $sum: 1 } })
        .limit(20)
        .end();
      const storeTotalRaw = await db.collection('redemption_code')
        .aggregate()
        .match(whereBase)
        .group({ _id: '$store_id', count: { $sum: 1 } })
        .limit(20)
        .end();

      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = todayStart + i * 24 * 60 * 60 * 1000;
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const dayRes = await db.collection('redemption_code')
          .where({ ...whereBase, status: 'used', used_time: dbCmd.gte(dayStart).and(dbCmd.lt(dayEnd)) })
          .count();
        trendData.push({
          date: new Date(dayStart).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
          count: (dayRes.result && typeof dayRes.result.total === 'number') ? dayRes.result.total : 0
        });
      }

      const storeIds = [...new Set([
        ...((storeRankingRaw && storeRankingRaw.data) || []).map(r => r._id),
        ...((storeTotalRaw && storeTotalRaw.data) || []).map(r => r._id)
      ].filter(Boolean))];

      const storeNameMap = {};
      if (storeIds.length) {
        const storeRes = await db.collection('store')
          .where({ _id: dbCmd.in(storeIds) })
          .field({ _id: true, name: true })
          .get();
        const stores = (storeRes.result && storeRes.result.data) ? storeRes.result.data : [];
        stores.forEach(s => { storeNameMap[s._id] = s.name; });
      }

      const storeRanking = ((storeRankingRaw && storeRankingRaw.data) || []).map(r => ({
        store_id: r._id,
        store_name: storeNameMap[r._id] || r._id || '未知门店',
        used_count: r.count
      })).sort((a, b) => b.used_count - a.used_count);

      const storeTotalMap = {};
      ((storeTotalRaw && storeTotalRaw.data) || []).forEach(r => { storeTotalMap[r._id] = r.count; });

      const storeWithRate = storeRanking.map(s => ({
        ...s,
        total_count: storeTotalMap[s.store_id] || 0,
        rate: storeTotalMap[s.store_id] ? ((s.used_count / storeTotalMap[s.store_id]) * 100).toFixed(1) : '0.0'
      }));

      const getTotal = (res) => (res.result && typeof res.result.total === 'number') ? res.result.total : 0;

      return {
        errCode: 0,
        data: {
          overview: {
            total: getTotal(totalCount),
            used: getTotal(usedCount),
            unused: getTotal(unusedCount),
            valid: getTotal(validCount),
            used_rate: getTotal(totalCount) ? ((getTotal(usedCount) / getTotal(totalCount)) * 100).toFixed(1) : '0.0'
          },
          timeline: {
            today: getTotal(todayUsed),
            week: getTotal(weekUsed),
            month: getTotal(monthUsed)
          },
          trend: trendData,
          store_ranking: storeWithRate
        }
      };
    }

    case 'orderStatistics': {
      const { start_date, end_date } = params || {};

      const now = Date.now();
      const defaultStartObj = new Date();
      defaultStartObj.setDate(1);
      defaultStartObj.setHours(0, 0, 0, 0);
      const defaultStart = defaultStartObj.getTime();

      const startTs = start_date ? new Date(start_date).getTime() : defaultStart;
      const endTs = end_date ? new Date(end_date).getTime() : now;

      const [totalOrders, paidOrders] = await Promise.all([
        db.collection('order').where({ create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }).count(),
        db.collection('order').where({ status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }).count()
      ]);

      const [totalAmountRes, paidAmountRes] = await Promise.all([
        db.collection('order').aggregate()
          .match({ create_date: { $gte: startTs, $lte: endTs } })
          .group({ _id: '$status', total_fee_sum: { $sum: '$total_fee' } })
          .end(),
        db.collection('order').aggregate()
          .match({ status: { $in: [1, 2, 3] }, create_date: { $gte: startTs, $lte: endTs } })
          .group({ _id: '$status', total_fee_sum: { $sum: '$total_fee' } })
          .end()
      ]);

      const provinceMap = {};
      const cityMap = {};

      const addrRes = await db.collection('order')
        .where({ status: dbCmd.in([1, 2, 3]), order_type: 'normal', create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) })
        .field({ _id: true, total_fee: true, status: true, address: true, create_date: true })
        .limit(1000)
        .get();
      const addressOrders = (addrRes.result && addrRes.result.data) ? addrRes.result.data : [];

      let totalAmount = 0;
      let paidAmount = 0;

      ((totalAmountRes && totalAmountRes.data) || []).forEach(r => { totalAmount += r.total_fee_sum || 0; });
      ((paidAmountRes && paidAmountRes.data) || []).forEach(r => { paidAmount += r.total_fee_sum || 0; });

      addressOrders.forEach(order => {
        const fee = order.total_fee || 0;
        const province = order.address?.province || order.address?.province_name || '未知省份';
        const city = order.address?.city || order.address?.city_name || '未知城市';

        if (!provinceMap[province]) provinceMap[province] = { count: 0, amount: 0 };
        provinceMap[province].count += 1;
        provinceMap[province].amount += fee;

        if (!cityMap[city]) cityMap[city] = { count: 0, amount: 0 };
        cityMap[city].count += 1;
        cityMap[city].amount += fee;
      });

      const provinceRanking = Object.entries(provinceMap)
        .map(([name, data]) => ({ name, count: data.count, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 15);

      const cityRanking = Object.entries(cityMap)
        .map(([name, data]) => ({ name, count: data.count, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 15);

      const [normalOrders, onlineOrders, offlineOrders] = await Promise.all([
        db.collection('order').where({ order_type: 'normal', status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }).count(),
        db.collection('order').where({ order_type: 'group_online', status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }).count(),
        db.collection('order').where({ order_type: 'group_offline', status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }).count()
      ]);

      const deliveryDistRaw = await db.collection('order')
        .aggregate()
        .match({ status: { $in: [1, 2, 3] }, delivery_method: { $exists: true }, create_date: { $gte: startTs, $lte: endTs } })
        .group({ _id: '$delivery_method', count: { $sum: 1 } })
        .end();

      const deliveryMap = { 1: '普通快递', 2: '大件物流', 3: '送货入户带安装', 4: '同城车队' };
      const deliveryDist = ((deliveryDistRaw && deliveryDistRaw.data) || []).map(r => ({
        name: deliveryMap[r._id] || `方式${r._id}`,
        count: r.count
      }));

      const dailyTrend = [];
      const daysDiff = Math.ceil((endTs - startTs) / (24 * 60 * 60 * 1000));
      const loopDays = Math.min(daysDiff, 30);
      for (let i = loopDays - 1; i >= 0; i--) {
        const dayStart = startTs + i * 24 * 60 * 60 * 1000;
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const dayCountRes = await db.collection('order')
          .where({ status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(dayStart).and(dbCmd.lt(dayEnd)) })
          .count();
        const dayAmountRes = await db.collection('order').aggregate()
          .match({ status: { $in: [1, 2, 3] }, create_date: { $gte: dayStart, $lt: dayEnd } })
          .group({ _id: '$status', total_fee_sum: { $sum: '$total_fee' } })
          .end();
        const orderCount = (dayCountRes.result && typeof dayCountRes.result.total === 'number') ? dayCountRes.result.total : 0;
        const dayAmount = ((dayAmountRes && dayAmountRes.data) || []).reduce((sum, r) => sum + (r.total_fee_sum || 0), 0);
        dailyTrend.push({
          date: new Date(dayStart).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }),
          count: orderCount,
          amount: dayAmount
        });
      }

      const todayStartObj = new Date();
      todayStartObj.setHours(0, 0, 0, 0);
      const todayStart = todayStartObj.getTime();
      const todayOrders = await db.collection('order')
        .where({ status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(todayStart) })
        .count();
      const todayAmountRes = await db.collection('order').aggregate()
        .match({ status: { $in: [1, 2, 3] }, create_date: { $gte: todayStart } })
        .group({ _id: '$status', total_fee_sum: { $sum: '$total_fee' } })
        .end();
      const todayAmount = ((todayAmountRes && todayAmountRes.data) || []).reduce((sum, r) => sum + (r.total_fee_sum || 0), 0);

      const getTotal = (res) => (res.result && typeof res.result.total === 'number') ? res.result.total : 0;

      return {
        errCode: 0,
        data: {
          summary: {
            total_orders: getTotal(totalOrders),
            paid_orders: getTotal(paidOrders),
            total_amount: totalAmount,
            paid_amount: paidAmount,
            avg_order_value: getTotal(paidOrders) ? Math.round(paidAmount / getTotal(paidOrders)) : 0
          },
          today: {
            orders: getTotal(todayOrders),
            amount: todayAmount
          },
          type_dist: [
            { name: '普通商品', count: getTotal(normalOrders) },
            { name: '线上团购', count: getTotal(onlineOrders) },
            { name: '线下核销', count: getTotal(offlineOrders) }
          ],
          delivery_dist: deliveryDist,
          province_ranking: provinceRanking,
          city_ranking: cityRanking,
          daily_trend: dailyTrend
        }
      };
    }

    default:
      return { errCode: -1, errMsg: '未知的 action: ' + action };
  }

  } catch (err) {
    console.error('[admin-redemption-api] Error:', err);
    return { errCode: 500, errMsg: '服务器内部错误: ' + (err.message || String(err)) };
  }
};
