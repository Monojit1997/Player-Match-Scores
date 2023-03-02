const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbpath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertDbObjectToResponseObjectforMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  const results = playersArray.map((player) =>
    convertDbObjectToResponseObject(player)
  );
  response.send(results);
});
//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId};`;
  const playersArray = await db.get(getPlayersQuery);
  const results = convertDbObjectToResponseObject(playersArray);
  response.send(results);
});
//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerDetails = `
  UPDATE player_details
    SET
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
  `;
  const deResponse = await db.run(updatePlayerDetails);
  response.send("Player Details Updated");
});
//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const mstchArray = await db.get(getMatchQuery);
  const results = convertDbObjectToResponseObjectforMatch(mstchArray);
  response.send(results);
});
//API 5

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayersQuery = `
    SELECT *
    FROM player_match_score
        NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;
  const playersArray = await db.all(getPlayersQuery);
  const results = playersArray.map((player) =>
    convertDbObjectToResponseObjectforMatch(player)
  );
  response.send(results);
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatchQuery = `
    SELECT player_details.player_id,player_details.player_name
    FROM player_details
        INNER JOIN player_match_score
    WHERE match_id = ${matchId};`;
  const playersArray = await db.all(getPlayerMatchQuery);
  const results = playersArray.map((player) =>
    convertDbObjectToResponseObject(player)
  );
  response.send(results);
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScoreQuery = `
    SELECT
        player_id,
        player_name,
        SUM(score),
        SUM(fours),
        SUM(sixes)
    FROM
        player_details
        NATURAL JOIN player_match_score
    WHERE 
        player_id = ${playerId};`;
  const playerArray = await db.get(getPlayerScoreQuery);
  response.send({
    playerId: playerArray["player_id"],
    playerName: playerArray["player_name"],
    totalScore: playerArray["SUM(score)"],
    totalFours: playerArray["SUM(fours)"],
    totalSixes: playerArray["SUM(sixes)"],
  });
});

module.exports = app;
