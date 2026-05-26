'use strict';

// 快递公司数据（已从 Excel 导入前50条，字段：name=公司名称, code=快递100拼音编码）
const expressCompanies = [
	{name: "圆通速递",   code: "yuantong",          sort: 1,  is_common: true},
	{name: "中通快递",   code: "zhongtong",          sort: 2,  is_common: true},
	{name: "申通快递",   code: "shentong",           sort: 3,  is_common: true},
	{name: "韵达快递",   code: "yunda",              sort: 4,  is_common: true},
	{name: "顺丰速运",   code: "shunfeng",           sort: 5,  is_common: true},
	{name: "极兔速递",   code: "jtexpress",           sort: 6,  is_common: true},
	{name: "京东物流",   code: "jd",                  sort: 7,  is_common: true},
	{name: "中国邮政",   code: "youzhengguonei",      sort: 8,  is_common: true},
	{name: "EMS",        code: "ems",                 sort: 9,  is_common: true},
	{name: "邮政电商标快",code: "youzhengdsbk",        sort: 10, is_common: true},
	{name: "德邦快递",   code: "debangkuaidi",        sort: 11, is_common: true},
	{name: "邮政标准快递",code: "youzhengbk",          sort: 12, is_common: true},
	{name: "菜鸟速递",   code: "danniao",             sort: 13, is_common: true},
	{name: "京东快运",   code: "jingdongkuaiyun",     sort: 14, is_common: false},
	{name: "中通快运",   code: "zhongtongkuaiyun",   sort: 15, is_common: false},
	{name: "德邦物流",   code: "debangwuliu",         sort: 16, is_common: false},
	{name: "跨越速运",   code: "kuayue",               sort: 17, is_common: false},
	{name: "安能快运",   code: "annengwuliu",          sort: 18, is_common: false},
	{name: "D速快递",    code: "dsukuaidi",            sort: 19, is_common: false},
	{name: "百世快运",   code: "baishiwuliu",          sort: 20, is_common: false},
	{name: "安得物流",   code: "annto",                sort: 21, is_common: false},
	{name: "韵达快运",   code: "yundakuaiyun",         sort: 22, is_common: false},
	{name: "壹米滴答",   code: "yimidida",             sort: 23, is_common: false},
	{name: "顺丰快运",   code: "shunfengkuaiyun",      sort: 24, is_common: false},
	{name: "顺心捷达",   code: "sxjdfreight",          sort: 25, is_common: false},
	{name: "京广速递",   code: "jinguangsudikuaijian", sort: 26, is_common: false},
	{name: "中通国际",   code: "zhongtongguoji",        sort: 27, is_common: false},
	{name: "日日顺物流", code: "rrs",                  sort: 28, is_common: false},
	{name: "EMS物流",    code: "emswuliu",             sort: 29, is_common: false},
	{name: "加运美",     code: "jiayunmeiwuliu",        sort: 30, is_common: false},
	{name: "速腾快递",   code: "suteng",                sort: 31, is_common: false},
	{name: "优速",       code: "youshuwuliu",           sort: 32, is_common: false},
	{name: "USPS",       code: "usps",                 sort: 33, is_common: false},
	{name: "UPS",        code: "ups",                  sort: 34, is_common: false},
	{name: "中铁快运",   code: "ztky",                 sort: 35, is_common: false},
	{name: "信丰物流",   code: "xinfengwuliu",         sort: 36, is_common: false},
	{name: "联昊通",     code: "lianhaowuliu",          sort: 37, is_common: false},
	{name: "DHL-中国件", code: "dhl",                  sort: 38, is_common: false},
	{name: "UPS-全球件", code: "upsen",                 sort: 39, is_common: false},
	{name: "全通速递",   code: "quantong56",            sort: 40, is_common: false},
	{name: "FedEx-国际件",code: "fedex",               sort: 41, is_common: false},
	{name: "转运四方",   code: "zhuanyunsifang",        sort: 42, is_common: false},
	{name: "Titan泰坦国际速递", code: "timelytitan",    sort: 43, is_common: false},
	{name: "平安达腾飞", code: "pingandatengfei",       sort: 44, is_common: false},
	{name: "EWE全球快递",code: "ewe",                  sort: 45, is_common: false},
	{name: "海信物流",   code: "savor",                 sort: 46, is_common: false},
	{name: "融辉物流",   code: "ronghui",               sort: 47, is_common: false},
	{name: "Japan Post", code: "japanposten",          sort: 48, is_common: false},
	{name: "CHINA POST", code: "chinapost",            sort: 49, is_common: false},
	{name: "安能快递",   code: "ane66",                  sort: 50, is_common: false}
];

/**
 * 规范化数据库记录，兼容中文字段名（Excel导入）和英文字段名（import action）
 */
function normalize(item) {
	return {
		name: item.name || item['公司名称'] || '',
		code: item.code || item['公司编码'] || '',
		sort: item.sort || item['排序'] || 0,
		is_common: item.is_common !== undefined ? item.is_common : (item['is_common'] !== undefined ? item['is_common'] : false)
	};
}

exports.main = async (event, context) => {
	const db = uniCloud.database();
	const dbCmd = db.command;

	const { action } = event;

	if (action === 'import') {
		await db.collection('express_company').where({}).remove();
		const addPromises = expressCompanies.map(item => {
			return db.collection('express_company').add({
				name: item.name,
				code: item.code,
				sort: item.sort,
				is_common: item.is_common
			});
		});
		try {
			await Promise.all(addPromises);
			return { errCode: 0, errMsg: '导入成功', data: { total: expressCompanies.length } };
		} catch (err) {
			return { errCode: 1, errMsg: '导入失败: ' + err.message };
		}
	}

	if (action === 'getList') {
		const { page = 1, pageSize = 100, commonOnly = false } = event;
		let query = db.collection('express_company');
		if (commonOnly) {
			query = query.where({ is_common: true });
		}
		const { data } = await query.orderBy('sort', 'asc').skip((page - 1) * pageSize).limit(pageSize).get();
		const { total } = await query.count();
		return { errCode: 0, errMsg: 'success', data: { list: data.map(normalize), total } };
	}

	if (action === 'getAll') {
		const { data } = await db.collection('express_company').orderBy('sort', 'asc').get();
		return { errCode: 0, errMsg: 'success', data: data.map(normalize) };
	}

	if (action === 'getByCode') {
		const { code } = event;
		const { data } = await db.collection('express_company').where({ code }).limit(1).get();
		const found = data && data.length > 0 ? normalize(data[0]) : null;
		return { errCode: 0, errMsg: 'success', data: found };
	}

	return { errCode: -1, errMsg: '未知的action' };
};
