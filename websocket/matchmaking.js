import { sleep } from "../utils/sleep.js";

function addUser(user, interests, interestUserMap, userInterestMap) {
  userInterestMap.set(user, interests);
  interests.forEach((i) => {
    const users = interestUserMap.get(i);
    if (!users || !users.size) {
      return interestUserMap.set(i, new Set([user]));
    }
    users.add(user);
  });
}

function deleteUser(user, interestUserMap, userInterestMap) {
  const userInterests = userInterestMap.get(user);
  if (!userInterests) return;
  userInterests.forEach((interest) => {
    const users = interestUserMap.get(interest);
    if (!users || !users.size) return;
    users.delete(user);
  });
  userInterestMap.delete(user);
}

async function findPeer(user, interests, interestUserMap, userInterestMap) {
  await sleep(Math.floor(Math.random() * 1000 + 1000));
  if (!interests || !interests.length) {
    const peers = Array.from(userInterestMap.keys());
    if (!peers || !peers.length) return [undefined, []];
    let peer = peers.random();
    if (peers.length === 1 && peer === user) return [undefined, []];
    while (peer === user) {
      peer = peers.random();
    }
    return [peer, []];
  }
  for (const i of interests.shuffle()) {
    const peers = Array.from(interestUserMap.get(i) || []);
    if (!peers || !peers.length) continue;
    let peer = peers.random();
    if (peers.length === 1 && peer === user) continue;
    while (peer === user) {
      peer = peers.random();
    }
    const peerInterests = new Set(userInterestMap.get(peer));
    const commonInterests = [...new Set(interests)].filter((x) =>
      peerInterests.has(x)
    );
    return [peer, commonInterests];
  }
  addUser(user, interests, interestUserMap, userInterestMap);
  await sleep(6000);
  if (user.peer) return [user.peer, []];
  deleteUser(user, interestUserMap, userInterestMap);
  return findPeer(user, [], interestUserMap, userInterestMap);
}

export function handleWebSocketConnection(wss, ws, req) {
  ws.init();
  ws.register("peopleOnline", () => {
    ws.send(
      JSON.stringify({ channel: "peopleOnline", data: wss.clients.size })
    );
  });
  ws.register("match", async ({ data, interests }) => {
    interests = interests.map((x) => x.trim().toLowerCase());
    ws.interestUserMap =
      data === "video" ? wss.videoInterestUserMap : wss.textInterestUserMap;
    ws.userInterestMap =
      data === "video" ? wss.videoUserInterestMap : wss.textUserInterestMap;
    const [peer, commonInterests] = await findPeer(
      ws,
      interests,
      ws.interestUserMap,
      ws.userInterestMap
    );
    if (ws.peer) return;
    if (!peer) {
      return addUser(ws, interests, ws.interestUserMap, ws.userInterestMap);
    }
    deleteUser(peer, peer.interestUserMap, peer.userInterestMap);
    ws.peer = peer;
    peer.peer = ws;
    ws.send(JSON.stringify({ channel: "connected", data: commonInterests }));
    ws.peer.send(
      JSON.stringify({ channel: "connected", data: commonInterests })
    );
    if (data === "video") {
      ws.send(JSON.stringify({ channel: "begin", data: "" }));
    }
  });
  ws.register("disconnect", async () => {
    if (!ws.peer) return;
    ws.peer.peer = undefined;
    ws.peer.send(JSON.stringify({ channel: "disconnect", data: "" }));
    ws.peer = undefined;
  });
  ws.on("close", () => {
    if (ws.peer) {
      ws.peer.send(JSON.stringify({ channel: "disconnect", data: "" }));
      ws.peer.peer = undefined;
    }
    if (!ws.interestUserMap || !ws.userInterestMap) return;
    deleteUser(ws, ws.interestUserMap, ws.userInterestMap);
  });
} 