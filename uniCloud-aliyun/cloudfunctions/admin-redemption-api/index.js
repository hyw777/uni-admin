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

      console.log('list - 开始查询, status:', status, 'keyword:', keyword);

      let where = {};
      if (status && status !== 'all') {
        // 兼容：待核销状态包括 unused 和 valid
        if (status === 'valid') {
          where.status = dbCmd.in(['unused', 'valid']);
        } else {
          where.status = status;
        }
      }
      if (store_id) {
        where.store_id = store_id;
      }
      if (keyword) {
        const re = new RegExp(keyword, 'i');
        where.code = re;
      }

      // 先查几条原始数据看看
      const rawData = await db.collection('redemption_code').limit(3).get();
      console.log('list - 原始核销码数据:', JSON.stringify(rawData).substring(0, 500));

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

      // 兼容不同返回格式：可能是 result.data 或 data
      const records = dataResult.data || (dataResult.result && dataResult.result.data) || [];
      const getCount = (res) => res?.total ?? res?.result?.total ?? 0;
      const total = getCount(countResult);

      console.log('list - 查询到记录数:', records.length, 'total:', total, 'dataResult:', JSON.stringify(dataResult).substring(0, 200));

      const orderIds = records.map(r => r.order_id).filter(Boolean);
      const orderMap = {};
      if (orderIds.length) {
        const orderRes = await db.collection('order')
          .where({ _id: dbCmd.in(orderIds) })
          .field({ _id: true, user_id: true, total_fee: true, items: true, order_type: true, order_no: true })
          .get();
        const orders = orderRes.data || (orderRes.result && orderRes.result.data) || [];
        orders.forEach(o => { orderMap[o._id] = o; });
      }

      const userIds = [...new Set(Object.values(orderMap).map(o => o.user_id).filter(Boolean))];
      const userMap = {};
      if (userIds.length) {
        const userRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(userIds) })
          .field({ _id: true, nickname: true, mobile: true })
          .get();
        const users = userRes.data || (userRes.result && userRes.result.data) || [];
        users.forEach(u => { userMap[u._id] = u; });
      }

      const usedByIds = [...new Set(records.map(r => r.used_by).filter(Boolean))];
      const usedByMap = {};
      if (usedByIds.length) {
        const usedByRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(usedByIds) })
          .field({ _id: true, nickname: true })
          .get();
        const usedByUsers = usedByRes.data || (usedByRes.result && usedByRes.result.data) || [];
        usedByUsers.forEach(u => { usedByMap[u._id] = u; });
      }

      const storeIds = [...new Set(records.map(r => r.store_id).filter(Boolean))];
      const storeMap = {};
      if (storeIds.length) {
        const storeRes = await db.collection('store')
          .where({ _id: dbCmd.in(storeIds) })
          .field({ _id: true, name: true })
          .get();
        const stores = storeRes.data || (storeRes.result && storeRes.result.data) || [];
        stores.forEach(s => { storeMap[s._id] = s; });
      }

      const enriched = records.map(r => {
        const order = orderMap[r.order_id] || {};
        const user = userMap[order.user_id] || {};
        const usedByUser = usedByMap[r.used_by] || {};
        const store = storeMap[r.store_id] || {};
        return {
          ...r,
          order_no: order.order_no || '',
          order_total_fee: order.total_fee || 0,
          order_type: order.order_type || '',
          goods_title: order.items?.[0]?.title || '',
          user_nickname: user.nickname || '未知用户',
          user_mobile: user.mobile || '',
          used_by_nickname: usedByUser.nickname || '—',
          store_name: store.name || r.store_id || ''
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
      const data = detailRes.data || (detailRes.result && detailRes.result.data) || [];
      if (!data || data.length === 0) return { errCode: 2, errMsg: '核销码不存在' };

      const record = data[0];

      let orderInfo = {};
      if (record.order_id) {
        const orderRes = await db.collection('order')
          .where({ _id: record.order_id })
          .field({ _id: true, order_no: true, user_id: true, total_fee: true, items: true, order_type: true, status: true, address: true, create_date: true })
          .get();
        const orders = orderRes.data || (orderRes.result && orderRes.result.data) || [];
        if (orders.length > 0) orderInfo = orders[0];
      }

      let userInfo = {};
      if (orderInfo.user_id) {
        const userRes = await db.collection('uni-id-users')
          .doc(orderInfo.user_id)
          .field({ nickname: true, mobile: true })
          .get();
        const users = userRes.data || (userRes.result && userRes.result.data) || [];
        if (users.length > 0) userInfo = users[0];
      }

      let usedByInfo = {};
      if (record.used_by) {
        const usedByRes = await db.collection('uni-id-users')
          .doc(record.used_by)
          .field({ nickname: true, mobile: true })
          .get();
        const users = usedByRes.data || (usedByRes.result && usedByRes.result.data) || [];
        if (users.length > 0) usedByInfo = users[0];
      }

      let storeInfo = {};
      if (record.store_id) {
        const storeRes = await db.collection('store')
          .doc(record.store_id)
          .field({ name: true, address: true, mobile: true })
          .get();
        const stores = storeRes.data || (storeRes.result && storeRes.result.data) || [];
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
      const invData = invRes.data || (invRes.result && invRes.result.data) || [];
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
      const fvData = fvRes.data || (fvRes.result && fvRes.result.data) || [];
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
      const extData = extRes.data || (extRes.result && extRes.result.data) || [];
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

      console.log('statistics - 开始统计, store_id:', store_id);

      const todayStart = new Date().setHours(0, 0, 0, 0);
      const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
      const monthStartObj = new Date();
      monthStartObj.setDate(1);
      monthStartObj.setHours(0, 0, 0, 0);
      const monthStart = monthStartObj.getTime();

      let whereBase = {};
      if (store_id) whereBase.store_id = store_id;

      // 查询每个状态的记录数 - count() 返回 {total: N}
      const [totalCount, usedCount, unusedCount, validCount] = await Promise.all([
        db.collection('redemption_code').where(whereBase).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'used' }).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'unused' }).count(),
        db.collection('redemption_code').where({ ...whereBase, status: 'valid' }).count()
      ]);

      // 提取 total，兼容不同返回格式
      const statTotal = (res) => res?.total ?? res?.result?.total ?? 0;
      const total = statTotal(totalCount);
      const used = statTotal(usedCount);
      const unused = statTotal(unusedCount);
      const valid = statTotal(validCount);

      console.log('statistics - 统计结果:', { total, used, unused, valid });

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
          count: dayRes?.total ?? dayRes?.result?.total ?? 0
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
        const stores = storeRes.data || (storeRes.result && storeRes.result.data) || [];
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

      const statTotal2 = (res) => res?.total ?? res?.result?.total ?? 0;

      return {
        errCode: 0,
        data: {
          overview: {
            total: statTotal2(totalCount),
            used: statTotal2(usedCount),
            unused: statTotal2(unusedCount),
            valid: statTotal2(validCount),
            used_rate: statTotal2(totalCount) ? ((statTotal2(usedCount) / statTotal2(totalCount)) * 100).toFixed(1) : '0.0'
          },
          timeline: {
            today: statTotal2(todayUsed),
            week: statTotal2(weekUsed),
            month: statTotal2(monthUsed)
          },
          trend: trendData,
          store_ranking: storeWithRate
        }
      };
    }

    case 'orderStatistics': {
      const { start_date, end_date } = params || {};

      console.log('orderStatistics - 开始统计, start_date:', start_date, 'end_date:', end_date);
      const now = Date.now();
      const defaultStartObj = new Date();
      defaultStartObj.setDate(1);
      defaultStartObj.setHours(0, 0, 0, 0);
      const defaultStart = defaultStartObj.getTime();

      const startTs = start_date ? new Date(start_date).getTime() : defaultStart;
      const endTs = end_date ? new Date(end_date).getTime() : now;

      console.log('orderStatistics - 时间戳范围:', { startTs, endTs, now, defaultStartObj: defaultStartObj.toISOString() });

      // 先查询几条订单看看数据结构
      const sampleOrders = await db.collection('order').limit(3).get();
      console.log('orderStatistics - 订单示例:', JSON.stringify(sampleOrders).substring(0, 800));

      // 统计所有订单（包括普通订单和团购订单）
      const [totalOrders, paidOrders] = await Promise.all([
        db.collection('order').where({ create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }).count(),
        db.collection('order').where({ status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) }).count()
      ]);

      // 兼容 count() 返回格式
      const getCount = (res) => res?.total ?? res?.result?.total ?? 0;
      const total = getCount(totalOrders);
      const paid = getCount(paidOrders);

      console.log('orderStatistics - 订单统计, total:', total, 'paid:', paid);

      // 额外查询全部订单数量（不受时间限制）用于对比
      const allOrdersCount = await db.collection('order').count();
      console.log('orderStatistics - 全部订单总数:', getCount(allOrdersCount));

      // 额外查询核销码状态
      const redemptionCounts = await Promise.all([
        db.collection('redemption_code').count(),
        db.collection('redemption_code').where({ status: 'used' }).count(),
        db.collection('redemption_code').where({ status: dbCmd.in(['unused', 'valid']) }).count()
      ]);
      console.log('orderStatistics - 核销码: 总数', getCount(redemptionCounts[0]), '已用', getCount(redemptionCounts[1]), '待用', getCount(redemptionCounts[2]));

      // 统计订单金额
      const paidAmountRes = await db.collection('order')
        .aggregate()
        .match({ status: { $in: [1, 2, 3] }, create_date: { $gte: startTs, $lte: endTs } })
        .group({ _id: null, total_fee_sum: { $sum: '$total_fee' }, count: { $sum: 1 } })
        .end();
      const paidAmountData = (paidAmountRes && paidAmountRes.data) || [];
      const paidAmount = paidAmountData[0]?.total_fee_sum || 0;

      // 统计订单类型分布
      const typeAgg = await db.collection('order')
        .aggregate()
        .match({ create_date: { $gte: startTs, $lte: endTs } })
        .group({ _id: '$order_type', count: { $sum: 1 }, amount: { $sum: '$total_fee' } })
        .end();
      const typeDist = ((typeAgg && typeAgg.data) || []).map(r => ({
        name: r._id === 'group_offline' ? '到店核销' : (r._id === 'normal' ? '普通订单' : (r._id || '其他')),
        count: r.count,
        amount: r.amount
      }));

      // 统计配送方式（仅普通订单）
      const deliveryAgg = await db.collection('order')
        .aggregate()
        .match({ order_type: 'normal', create_date: { $gte: startTs, $lte: endTs } })
        .group({ _id: '$delivery_method', count: { $sum: 1 } })
        .end();
      const deliveryDist = ((deliveryAgg && deliveryAgg.data) || []).map(r => ({
        name: { 1: '快递', 2: '大件物流', 3: '送货入户带安装', 4: '同城车队' }[r._id] || '其他',
        count: r.count
      }));

      // 省份和城市统计
      // 普通订单从订单的收货地址获取，线下团购从门店获取
      const provinceMap = {};
      const cityMap = {};

      // 查询所有已支付订单
      const allOrders = await db.collection('order')
        .where({ status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(startTs).and(dbCmd.lte(endTs)) })
        .field({ _id: true, total_fee: true, order_type: true, address: true, store_id: true })
        .limit(1000)
        .get();
      const allOrdersData = allOrders.data || (allOrders.result && allOrders.result.data) || [];
      console.log('orderStatistics - 已支付订单总数:', allOrdersData.length);

      if (allOrdersData.length > 0) {
        // 打印第一个订单看看结构
        console.log('orderStatistics - 订单地址示例:', JSON.stringify(allOrdersData[0]).substring(0, 500));
      }

      // 查询所有门店信息备用
      const storeIds = [...new Set(allOrdersData.map(o => o.store_id).filter(Boolean))];
      const storeMap = {};
      if (storeIds.length) {
        const storeRes = await db.collection('store')
          .where({ _id: dbCmd.in(storeIds) })
          .field({ _id: true, name: true, province: true, city: true, address: true })
          .get();
        const stores = storeRes.data || (storeRes.result && storeRes.result.data) || [];
        stores.forEach(s => { storeMap[s._id] = s; });
      }
      console.log('orderStatistics - 门店信息:', JSON.stringify(storeMap));

      // 处理所有订单
      allOrdersData.forEach(order => {
        const fee = order.total_fee || 0;
        let province = '';
        let city = '';

        if (order.order_type === 'normal') {
          // 普通订单：从 address 字段获取
          const addr = order.address || {};
          const detail = addr.detail || addr.address || '';

          if (detail) {
            // 从详细地址字符串解析省份和城市
            // 格式通常是：XX省XX市XX区/县XX路
            const provMatch = detail.match(/^(.+省|.+自治区|.+特别行政区)/);
            if (provMatch) {
              province = provMatch[1];
            } else {
              // 直辖市格式：北京、上海、天津、重庆
              const zxsMatch = detail.match(/^(北京|上海|天津|重庆)/);
              if (zxsMatch) {
                province = zxsMatch[1];
                city = zxsMatch[1]; // 直辖市省份和城市相同
              }
            }

            if (!city) {
              // 匹配市、地区、自治州 - 提取省后面的城市名
              const cityMatch = detail.match(/(?:省|自治区|特别行政区)(.+?(?:市|地区|自治州))/) || detail.match(/(?:省|自治区)(.+?市)/);
              if (cityMatch) {
                city = cityMatch[1];
              }
            }
          }

          // 如果 address 有独立的省份城市字段也尝试获取
          if (!province) province = addr.province || addr.province_name || '';
          if (!city) city = addr.city || addr.city_name || '';

          console.log('orderStatistics - 解析地址:', { detail, province, city });
        } else {
          // 团购订单：优先用订单中存储的门店信息
          const store = storeMap[order.store_id] || {};
          let storeName = store.name || order.redemption_store_name || '';
          let storeAddr = store.address || order.redemption_store_address || '';

          // 如果有门店地址，从地址解析
          if (storeAddr) {
            const provMatch = storeAddr.match(/^(.+省|.+自治区|.+特别行政区)/);
            if (provMatch) {
              province = provMatch[1];
            } else {
              const zxsMatch = storeAddr.match(/^(北京|上海|天津|重庆)/);
              if (zxsMatch) {
                province = zxsMatch[1];
                city = zxsMatch[1];
              }
            }
            if (!city) {
              const cityMatch = storeAddr.match(/(?:省|自治区|特别行政区)(.+?(?:市|地区|自治州))/) || storeAddr.match(/(?:省|自治区)(.+?市)/);
              if (cityMatch) city = cityMatch[1];
            }
          }

          // 如果没有，用门店的省份城市字段
          if (!province) province = store.province || '';
          if (!city) city = store.city || storeName || '';

          console.log('orderStatistics - 团购订单门店信息:', { storeId: order.store_id, storeName, storeAddr, province, city });
        }

        if (!province) return;
        const provKey = province;
        const cityKey = city || '未知城市';

        if (!provinceMap[provKey]) provinceMap[provKey] = { count: 0, amount: 0 };
        provinceMap[provKey].count += 1;
        provinceMap[provKey].amount += fee;

        if (!cityMap[cityKey]) cityMap[cityKey] = { count: 0, amount: 0 };
        cityMap[cityKey].count += 1;
        cityMap[cityKey].amount += fee;
      });

      console.log('orderStatistics - 省份统计结果:', JSON.stringify(provinceMap));
      console.log('orderStatistics - 城市统计结果:', JSON.stringify(cityMap));

      const provinceRanking = Object.entries(provinceMap)
        .map(([name, data]) => ({ name, count: data.count, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 15);

      const cityRanking = Object.entries(cityMap)
        .map(([name, data]) => ({ name, count: data.count, amount: data.amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 15);

      const dailyTrend = [];
      const daysDiff = Math.ceil((endTs - startTs) / (24 * 60 * 60 * 1000));
      const loopDays = Math.min(daysDiff, 30);
      console.log('orderStatistics - 日趋势查询，loopDays:', loopDays);

      for (let i = loopDays - 1; i >= 0; i--) {
        const dayStart = startTs + i * 24 * 60 * 60 * 1000;
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        console.log('orderStatistics - 查询日期:', new Date(dayStart).toISOString().split('T')[0]);

        const dayCountRes = await db.collection('order')
          .where({ status: dbCmd.in([1, 2, 3]), create_date: dbCmd.gte(dayStart).and(dbCmd.lt(dayEnd)) })
          .count();
        const dayAmountRes = await db.collection('order').aggregate()
          .match({ status: { $in: [1, 2, 3] }, create_date: { $gte: dayStart, $lt: dayEnd } })
          .group({ _id: null, total_fee_sum: { $sum: '$total_fee' } })
          .end();
        const orderCount = dayCountRes?.total ?? dayCountRes?.result?.total ?? 0;
        const dayAmount = ((dayAmountRes && dayAmountRes.data) || [])[0]?.total_fee_sum || 0;

        console.log('orderStatistics - 日期:', new Date(dayStart).toISOString().split('T')[0], '订单数:', orderCount, '金额:', dayAmount);

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
        .group({ _id: null, total_fee_sum: { $sum: '$total_fee' } })
        .end();
      const todayAmount = ((todayAmountRes && todayAmountRes.data) || [])[0]?.total_fee_sum || 0;

      return {
        errCode: 0,
        data: {
          summary: {
            total_orders: total,
            paid_orders: paid,
            total_amount: paidAmount,
            paid_amount: paidAmount,
            avg_order_value: paid ? Math.round(paidAmount / paid) : 0
          },
          today: {
            orders: todayOrders?.total ?? todayOrders?.result?.total ?? 0,
            amount: todayAmount
          },
          type_dist: typeDist,
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
