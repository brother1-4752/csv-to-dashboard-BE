const express = require("express");
const db = require("./doc-db");
const router = express.Router();

let filteredDataList = [];

// 검색 API 구현
router.post("/search", async (req, res) => {
  let columnsList = [];

  // 검색 필터 조건
  const serviceName = req.body.serviceName;
  const firstDate = req.body.firstDate;
  const endDate = req.body.endDate;
  const userId = req.body.userId;

  // 컬렉션 타입
  const collectionTypes = [
    "t_installs_b", // 앱스플라이어 1
    "t_conversions_retargeting_b", // 앱스플라이어 2
    `${serviceName === "hiver" ? "t_amplitude_h" : "t_amplitude_b"}`, // 앰플리튜드 1
  ];

  const collectionList = (await db.db.listCollections().toArray()).map(
    (collection) => {
      return collection.name;
    }
  );
  res.json({ columnsList: collectionList });

  // // 컬렉션 타입 : conversions | conversions외의 appsflyer | amplitude
  // const collectionTypes = [
  //   "t_installs_b", // 다른 컬렉션에 비해 데이터가 적은 컬렉션
  //   "t_conversions_retargeting_b",
  //   `${serviceName === "hiver" ? "t_amplitude_h" : "t_amplitude_b"}`,
  // ];

  // // 컬렉션별 컬럼 합치기
  // for (const type of collectionTypes) {
  //   const columns = await db.collection(type).findOne(); //findOne은 nullable
  //   // 컬렉션을 찾을 수 없을 때 에러 처리
  //   try {
  //     if (!columns) res.status(404).send("컬렉션을 찾을 수 없습니다.");

  //     columnsList.push();
  //   } catch (error) {
  //     console.error(error);
  //   }

  //   columnsList.push(...Object.keys(columns));
  // }

  // const collections = await db.db.listCollections().toArray();
  // const collectionsNameList = collections.map((collection) => {
  //   if (serviceName === "hiver" && collection.name.includes("_h")) {
  //     return collection.name;
  //   } else if (serviceName === "brandi" && collection.name.includes("_b")) {
  //     return collection.name;
  //   } else {
  //     return;
  //   }
  // });

  // const filteredCollectionsNameList = collectionsNameList.filter(
  //   (collection) =>
  //     collection !== undefined &&
  //     collection !== "meta_batch_log" &&
  //     !collection.includes("t_amplitude") &&
  //     !collection.includes("t_inapps_")
  // );

  // const t_inapps = serviceName === "hiver" ? "t_inapps_h" : "t_inapps_b";
  // const t_inapps_retargeting =
  //   serviceName === "hiver"
  //     ? "t_inapps_retargeting_h"
  //     : "t_inapps_retargeting_b";
  // const t_amplitude =
  //   serviceName === "hiver" ? "t_amplitude_h" : "t_amplitude_b";

  // const fetchAppsDocuments = async (db, collectionName) => {
  //   let documents = [];
  //   let cursor = db
  //     .collection(collectionName)
  //     .find({
  //       $and: [
  //         { media_source: { $in: ["Facebook Ads", "restricted"] } },
  //         {
  //           $and: [
  //             { event_time_kst: { $gte: `${firstDate} 00:00:00` } },
  //             { event_time_kst: { $lte: `${endDate} 23:59:59` } },
  //           ],
  //         },
  //         { customer_user_id: userId },
  //       ],
  //     })
  //     .batchSize(1000);

  //   while (await cursor.hasNext()) {
  //     const batchDocuments = await cursor.next();
  //     documents = documents.concat(batchDocuments);

  //     if (documents.length >= 1000) {
  //       break;
  //     }
  //   }

  //   return documents;
  // };

  // const fetchAmplDocuments = async (db, collectionName) => {
  //   let documents = [];
  //   let cursor = db
  //     .collection(collectionName)
  //     .find({
  //       $and: [
  //         {
  //           $and: [
  //             { event_time_kst: { $gte: `${firstDate} 00:00:00` } },
  //             { event_time_kst: { $lte: `${endDate} 23:59:59` } },
  //           ],
  //         },
  //         { user_id: userId },
  //       ],
  //     })
  //     .batchSize(1000);

  //   while (await cursor.hasNext()) {
  //     const batchDocuments = await cursor.next();
  //     documents = documents.concat(batchDocuments);

  //     if (documents.length >= 1000) {
  //       break;
  //     }
  //   }

  //   return documents;
  // };

  // try {
  //   console.log(filteredCollectionsNameList);

  //   console.time("검색 시간");
  //   // 양 적은 컬렉션 우선 탐색 : 모두 앱스플라이어 컬렉션
  //   for (const collectionName of filteredCollectionsNameList) {
  //     console.log(collectionName, "검색 시작", new Date());

  //     // 디비 내 컬렉션 순회하고 유저 아이디와 일치하는 데이터 읽어온 후
  //     const result = await db
  //       .collection(collectionName)
  //       .find({
  //         $and: [
  //           { media_source: { $in: ["Facebook Ads", "restricted"] } },
  //           {
  //             $and: [
  //               { event_time_kst: { $gte: `${firstDate} 00:00:00` } },
  //               { event_time_kst: { $lte: `${endDate} 23:59:59` } },
  //             ],
  //           },
  //           { customer_user_id: userId },
  //         ],
  //       })
  //       .toArray();

  //     filteredDataList.push(...result);
  //     console.log(collectionName, "검색 종료", new Date());
  //   }

  //   // inapps -> inapps_retargeting -> amplitude 순으로 검색
  //   // inapps 검색
  //   console.log("t_conversions_retargeting_h", "검색 시작", new Date());
  //   const result_inapps = await fetchAppsDocuments(db, t_inapps);
  //   filteredDataList.push(...result_inapps);
  //   console.log("검색 완료", new Date());

  //   // inapps_retargeting 검색
  //   console.log(t_inapps_retargeting, "검색 시작", new Date());
  //   const result_inapps_retargeting = await fetchAppsDocuments(
  //     db,
  //     t_inapps_retargeting
  //   );
  //   filteredDataList.push(...result_inapps_retargeting);
  //   console.log("검색 완료", new Date());

  //   // amplitude 검색
  //   console.log(t_amplitude, "검색 시작", new Date());
  //   const result_amplitude = await fetchAmplDocuments(db, t_amplitude);
  //   filteredDataList.push(...result_amplitude);
  //   console.log("검색 종료", new Date());

  //   console.log("---검색 완료---");
  // } catch (error) {
  //   console.error(error);
  // }
  // console.timeEnd("검색 시간");

  // res.json({ dataList: filteredDataList, columnsList });
});

module.exports = router;
