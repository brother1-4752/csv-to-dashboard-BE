const db = require("../doc-db");

const createColumnList = () => {
  let headerList = [];

  // 컬렉션 타입과 플래그를 key-value로 가지는 객체
  const collectionTypes = {
    t_installs_h: "__apps",
    t_conversions_retargeting_h: "__conversion",
    t_amplitude_h: "__ampl",
  };

  Object.keys(collectionTypes).map(async (type) => {
    const result = await db.collection(type).findOne();
    const keys = Object.keys(result);
    console.log(type, "컬럼 수 : ", keys.length);
    keys.unshift(collectionTypes[type]);

    headerList.push(keys);
  });

  return headerList;
};

module.exports = createColumnList;
