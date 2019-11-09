const RPCClient = require('@alicloud/pop-core').RPCClient;
const got = require('got');
const assert = require('assert');

const { AccessKeyId, AccessKeySecret, Domain, SubDomain, TTL = 5 * 60 * 1000 } = process.env;

assert(AccessKeyId, `AccessKeyId cannot be empty.`);
assert(AccessKeySecret, `AccessKeySecret cannot be empty.`);
assert(Domain, `Domain cannot be empty.`);
assert(SubDomain, `SubDomain cannot be empty.`);

const client = new RPCClient({
  accessKeyId: AccessKeyId,
  accessKeySecret: AccessKeySecret,
  endpoint: 'https://alidns.aliyuncs.com',
  apiVersion: '2015-01-09'
});

function log(...args) {
  console.log(`[${new Date().toLocaleString()}]`, ...args);
}

async function getIP() {
  const ret = await got('https://ddns.oray.com/checkip');
  if (ret.statusCode === 200 && ret.body) {
    const match = ret.body.match(/Current IP Address: (.+?)$/);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  throw new Error('获取IP异常，请检查网络连接');
}

async function query(domain, rr) {
  const result = await client.request('DescribeDomainRecords', {
    DomainName: domain,
    RRKeyWord: rr,
    TypeKeyWord: 'A',
    PageSize: 100,
    TTL: 600,
  }, {
      timeout: 3000, // default 3000 ms
      formatAction: true, // default true, format the action to Action
      formatParams: true, // default true, format the parameter name to first letter upper case
      method: 'GET', // set the http method, default is GET
      headers: {}, // set the http request headers
    });
  return result;
}

async function add(domain, rr, value) {
  // options
  const result = await client.request('AddDomainRecord', {
    // Action: 'AddDomainRecord',
    DomainName: domain,
    RR: rr,
    Type: 'A',
    Value: value,
    TTL: 600,
  }, {
      timeout: 3000, // default 3000 ms
      formatAction: true, // default true, format the action to Action
      formatParams: true, // default true, format the parameter name to first letter upper case
      method: 'GET', // set the http method, default is GET
      headers: {}, // set the http request headers
    });
  return result;
}

async function modify(recordId, rr, value) {
  // options
  const result = await client.request('UpdateDomainRecord', {
    // Action: 'AddDomainRecord',
    RecordId: recordId,
    RR: rr,
    Type: 'A',
    Value: value,
    TTL: 600,
  }, {
      timeout: 3000, // default 3000 ms
      formatAction: true, // default true, format the action to Action
      formatParams: true, // default true, format the parameter name to first letter upper case
      method: 'GET', // set the http method, default is GET
      headers: {}, // set the http request headers
    });
  return result;
}

async function main(domain, rr, interval) {
  let ip;
  try {
    ip = await getIP();
    log('当前公网IP', ip);
  } catch (e) {
    log(e.message);
    return;
  }

  const list = await query(domain, rr);
  let hasRecord = false;
  let recordId;
  if (list.DomainRecords && list.DomainRecords.Record && list.DomainRecords.Record.length) {
    for (const record of list.DomainRecords.Record) {
      if (record.DomainName === domain && record.RR === rr) {
        if (record.Value === ip) {
          log('公网IP未变化');
          return;
        }
        hasRecord = true;
        recordId = record.RecordId;
      }
    }
  }

  try {
    let result;
    if (!hasRecord) {
      log('当前无记录');
      result = await add(domain, rr, ip);
    } else {
      log('当前有记录', recordId);
      result = await modify(recordId, rr, ip);
    }
    if (result.RequestId) {
      log('设置成功', result.RequestId);
    }
  } catch (e) {
    log('设置失败');
    if (e.message.indexOf('DomainRecordDuplicateError')) {
      log('[DomainRecordDuplicateError] 可能是公网IP并未发生变化');
    } else {
      log(e.message);
    }
  }
}

async function tick() {
  try {
    await main(Domain, SubDomain)
  } catch (e) {
    log('发生未知错误');
    log(e);
  }
  setTimeout(tick, TTL);
}

tick();
