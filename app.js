const express = require("express");
const app = express();

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
app.use(express.json());
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("No Errors");
    });
  } catch (e) {
    console.log(`Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convert = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistricts = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//Get all states API
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`;
  const dbArray = await db.all(getStatesQuery);
  response.send(dbArray.map((each) => convert(each)));
});

//get state API
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    SELECT * FROM state WHERE state_id=${stateId};`;
  const dbArray = await db.all(getStatesQuery);
  response.send(dbArray.map((each) => convert(each)));
});

//add district API
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
        INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
        VALUES (
            '${districtName}',
            '${stateId}',
            '${cases}',
            '${cured}',
            '${active}',
            '${deaths}'
        );
    `;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//get district API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictAPI = `
    SELECT * FROM district WHERE district_id=${districtId};
    `;
  const dbResponse = await db.get(getDistrictAPI);
  response.send(convertDistricts(dbResponse));
});

//delete district API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id=${districtId};
    `;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//update district API6
app.put("/districts/:districtId/", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
        UPDATE district
        SET 
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
        WHERE district_id=${districtId};
    `;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API7 get statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsOfStateQuery = `
        SELECT SUM(cases) AS totalCases,
        SUM(cured) AS totalCured,
        SUM(active) AS totalActive,
        SUM(deaths) AS totalDeaths
        FROM district
        WHERE state_id=${stateId};
    `;
  const dbResponse = await db.all(getStatsOfStateQuery);
  response.send(dbResponse);
});

//API8 get stateName on districtId
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameByDistrictIdQuery = `
        SELECT state.state_name AS stateName from state 
        INNER JOIN  district ON 
        state.state_id=district.state_id
        WHERE district.district_id=${districtId};
    `;
  const dbResponse = await db.all(getStateNameByDistrictIdQuery);
  response.send(dbResponse);
});
module.exports = app;
