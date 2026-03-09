const ws = new WebSocket(`wss://${location.host}`);

const streamBtn = document.getElementById("stream-btn");
const playBtn = document.getElementById("play-btn");

const optionsContainer = document.getElementById("options-container");
const inputContainer = document.getElementById("input-container");
const videoContainer = document.getElementById("video-container");
const connectivityOptionsContainer = document.getElementById(
  "connectivity-options-container",
);

const videoInput = document.getElementById("video-input");

const role = document.getElementById("role");
const streamerVideo = document.getElementById("streamer-video");

const makeOfferBtn = document.getElementById("make-offer-btn");
const selectionMenu = document.getElementById("iceservers-options");
const recreatePcBtn = document.getElementById("recreate-pc-btn");

const stopStreamBtn = document.getElementById("stop-stream-btn");
const muteAudioBtn = document.getElementById("mute-audio-btn");
const muteVideoBtn = document.getElementById("mute-video-btn");

let player = null;
let streamer = null;

let pc = null;
let stream = null;
let remoteStream = null;

let config = null;

let startTime = null;

let candidate_id = 0;
let candidates = [
  {
    candidate:
      "candidate:0 1 UDP 92217343 172.7.191.87 53295 typ relay raddr 172.7.191.87 rport 53295",
    sdpMLineIndex: 0,
    sdpMid: "0",
    //usernameFragment: "5bb2eded",
  },
  {
    candidate:
      "candidate:0 2 UDP 92217342 172.7.191.87 58014 typ relay raddr 172.7.191.87 rport 58014",
    sdpMLineIndex: 0,
    sdpMid: "0",
    //usernameFragment: "5bb2eded",
  },
  {
    candidate:
      "candidate:1 1 UDP 8331263 172.7.191.87 52158 typ relay raddr 172.7.191.87 rport 52158",
    sdpMLineIndex: 0,
    sdpMid: "0",
    //usernameFragment: "5bb2eded",
  },
  {
    candidate:
      "candidate:1 2 UDP 8331262 172.7.191.87 52317 typ relay raddr 172.7.191.87 rport 52317",
    sdpMLineIndex: 0,
    sdpMid: "0",
    //usernameFragment: "5bb2eded",
  },
  {
    candidate: "",
    sdpMLineIndex: 0,
    sdpMid: "0",
    //usernameFragment: "5bb2eded",
  },
];

async function getServers() {
  const baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Tokens.json`;
  const credentials = btoa(`${accountSid}:${authToken}`);

  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "", 
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();

    // console.log("Twilio Response:", data);

    return {
      iceServers: data.ice_servers,
    };
  } catch (err) {
    // console.error("Twilio Token Request Error:", err);
    throw err; // rethrow so caller can handle it with try/catch
  }
}

const configs = [
  // 0 - No STUN/TURN
  {},
  // 1 - ONLY STUN
  {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun3.l.google.com:19302",
      },
    ],
  },
  // 2 - TWILIO
  {
    iceTransportPolicy: "relay",
  },
  // 3 - BUILD MACHINE
  {
    iceTransportPolicy: "relay",
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun3.l.google.com:19302",
      },
      {
        urls: "turn: :3478?transport=udp",
        username: "test",
        credential: "test",
      },
      {
        urls: "turn:172.7.191.69:3478?transport=tcp",
        username: "test",
        credential: "test",
      },
    ],
  },
  // 4 - AWS
  {
    iceTransportPolicy: "relay",
    iceServers: [
      {
        urls: "stun:turn-server.eaglepixelstreaming.com",
      },
      {
        urls: "turn:turn-server.eaglepixelstreaming.com:3478?transport=udp",
        username: "new",
        credential: "pass",
      },
      {
        urls: "turn:turn-server.eaglepixelstreaming.com:3478?transport=tcp",
        username: "new",
        credential: "pass",
      },
      {
        urls: "turns:turn-server.eaglepixelstreaming.com:5349?transport=tcp",
        username: "new",
        credential: "pass",
      }
    ],
  },
  // {
  //   iceTransportPolicy: "relay",
  //   iceServers: [
  //     {
  //       urls: "stun:turn-server.eaglepixelstreaming.com:3478",
  //     },
  //     {
  //       urls: "turn:turn-server.eaglepixelstreaming.com:3478?transport=udp",
  //       username: "test",
  //       credential: "test",
  //     },
  //     {
  //       urls: "turn:turn-server.eaglepixelstreaming.com:3478?transport=tcp",
  //       username: "test",
  //       credential: "test",
  //     },
  //     {
  //       urls: "turns:turn-server.eaglepixelstreaming.com:5349?transport=tcp",
  //       username: "test",
  //       credential: "test",
  //     },
  //   ],
  // },
  //5 - local
  {
    iceTransportPolicy: "relay",
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
      {
        urls: "stun:stun3.l.google.com:19302",
      },
      {
        urls: "turn:192.168.0.106:3478?transport=udp",
        username: "test",
        credential: "test",
      },
      {
        urls: "turn:192.168.0.106:3478?transport=tcp",
        username: "test",
        credential: "test",
      },
    ],
  },
  //6 - Metered
  {
    iceTransportPolicy: "relay",
    iceServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
      {
        urls: "turn:global.relay.metered.ca:80",
        username: "5796e7de24f538d455c35da0",
        credential: "VZgnKFq4rlMizqcO",
      },
      {
        urls: "turn:global.relay.metered.ca:80?transport=tcp",
        username: "5796e7de24f538d455c35da0",
        credential: "VZgnKFq4rlMizqcO",
      },
      {
        urls: "turn:global.relay.metered.ca:443",
        username: "5796e7de24f538d455c35da0",
        credential: "VZgnKFq4rlMizqcO",
      },
      {
        urls: "turns:global.relay.metered.ca:443?transport=tcp",
        username: "5796e7de24f538d455c35da0",
        credential: "VZgnKFq4rlMizqcO",
      },
    ],
  },
  //7 - stun and turn
  {
    iceTransportPolicy: "relay",
    iceServers: [
      {
        urls: "turn:103.126.36.6:3478?transport=udp",
        username: "test",
        credential: "test",
      },
      {
        urls: "turn:103.126.36.6:3478?transport=tcp",
        username: "test",
        credential: "test",
      },
    ],
  },
  // 8 - CoTurn Mumbai
  {
    iceTransportPolicy: "relay",
    iceServers: [
      {
        urls: "turn:13.233.106.107:3478?transport=udp",
        username: "test",
        credential: "test",
      },
      {
        urls: "turn:13.233.106.107:3478?transport=tcp",
        username: "test",
        credential: "test",
      },
    ]
  },
  {
    iceServers: [
      {
        urls: "stun:103.126.36.6:3478",
      },
      {
        urls: "turn:103.126.36.6:3478?transport=udp",
        username: "test",
        credential: "test",
      },
      {
        urls: "turn:103.126.36.6:3478?transport=tcp",
        username: "test",
        credential: "test",
      },
    ],
  },
];

// get TWILIO ice servers
(async () => {
  //twilioIceServers = await getServers();
  configs[2] = await getServers();
  configs[2].iceTransportPolicy = "relay";
})();


// get LOCAL ice servers
(async () => {
  const response = await fetch('https://turn-server.eaglepixelstreaming.com/api/credentials');
  const data = await response.json();
  
  configs[5].iceServers = data.iceServers;
  configs[5].iceTransportPolicy = "relay";
})();

function iceGatheringCompleted(pc) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") {
      return resolve();
    }

    function checkState() {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }
    }

    pc.addEventListener("icegatheringstatechange", checkState);
  });
}

async function dtlsConnected(pc) {
  const sender = pc.getSenders().find((s) => s.transport);
  const receiver = pc.getReceivers().find((r) => r.transport);
  const transport = sender?.transport || receiver?.transport;

  if (!transport) {
    await new Promise((res) => setTimeout(res, 50));
    return dtlsConnected(pc);
  }

  if (transport.state === "connected") {
    return;
  }

  await new Promise((res) => {
    transport.addEventListener("statechange", function checkState() {
      if (transport.state === "connected") {
        transport.removeEventListener("statechange", checkState);
        res();
      }
    });
  });
}

async function iceConnected(pc) {
  if (
    pc.iceConnectionState === "connected" ||
    pc.iceConnectionState === "completed"
  ) {
    return;
  }

  await new Promise((res) => {
    pc.addEventListener("iceconnectionstatechange", function checkState() {
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        pc.removeEventListener("iceconnectionstatechage", checkState);
        res();
      }
    });
  });
}

function dtlsState(pc) {
  const sender = pc.getSenders().find((s) => s.transport);
  const receiver = pc.getReceivers().find((r) => r.transport);
  const transport = sender?.transport || receiver?.transport;

  return transport.state === "connected";
}

async function isUsingTurn(peerConnection) {
  if (!peerConnection) {
    throw new Error("Bad Usage");
  }

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function peerConnected(pc) {
    if (
      pc.connectionState === "connected" ||
      pc.connectionState === "completed"
    ) {
      return;
    }

    await new Promise((res) => {
      pc.addEventListener("connectionstatechange", function checkState() {
        if (
          pc.connectionState === "connected" ||
          pc.connectionState === "completed"
        ) {
          pc.removeEventListener("connectionstatechage", checkState);
          res();
        }
      });
    });
  }

  const timeout = 2000;
  async function nominatedCandidate(peerConnection, timeout) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const stats = await peerConnection.getStats();

      for (let stat of stats.values()) {
        if (stat.type === "candidate-pair" && stat.nominated) {
          return stat.localCandidateId;
        }
      }
      await sleep(50);
    }

    throw new Error("Timeout Reached: Nominated Candidate Not Found");
  }

  await peerConnected(peerConnection);

  let localCandidateId = await nominatedCandidate(peerConnection, timeout);

  const stats = await peerConnection.getStats();

  for (let stat of stats.values()) {
    if (stat.type === "local-candidate" && stat.id === localCandidateId) {
      return stat.candidateType === "relay";
    }
  }
}

function createPeerConnection(config) {
  config = configs[+selectionMenu.value];

  console.log("CREATING NEW PC");

  pc = new RTCPeerConnection(config);

  pc.addEventListener("icecandidate", ({ candidate }) => {
    if (candidate) {
      //candidates.push(new RTCIceCandidate(candidate));
      console.log("******************************************");
      console.table(candidate);
      console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
      console.table(candidate.url);
      console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
      ws.send(JSON.stringify({ type: "candidate", candidate }));
      // candidate = candidates[candidate_id % candidates.length];
      // candidate_id++;
      // ws.send(JSON.stringify({ type: "candidate", candidate }));
      //console.log(candidates);
    }
  });

  pc.addEventListener("track", (event) => {
    ws.send(JSON.stringify({ type: "track" }));
    console.log(">>> TRACK RECEIVED <<<<");
    remoteStream.addTrack(event.track);
  });

  pc.addEventListener("icegatheringstatechange", () => {
    switch (pc.iceGatheringState) {
      case "gathering":
        iceGatheringStart = performance.now();
        break;
      case "complete":
        console.log(
          `*** time: ${(performance.now() - iceGatheringStart).toFixed(
            2,
          )} ms ***`,
        );
    }
  });

  pc.addEventListener("connectionstatechange", async () => {
    console.log(`pc.connectionState: ${pc.connectionState}`);
    switch (pc.connectionState) {
      case "connected":
        console.log("CONNECTED");
        const starttime = performance.now();
        const usingTurn = await isUsingTurn(pc);
        console.log(`Using TURN: ${usingTurn}`);
        console.log(`time: ${(performance.now() - starttime).toFixed(2)} ms`);
        const endTime = performance.now();
        console.log(`Time: ${(endTime - startTime).toFixed(2)} ms`);
        break;

      case "completed":
        console.log("COMPLETED");
        break;

      case "failed":
        console.log("FAILED");
        // alert("Failed to Connect Peer");
        break;

      case "disconnected":
        console.log("DISCONNECTED");
        break;

      default:
        break;
    }
  });

  pc.addEventListener("iceconnectionstatechange", async () => {
    console.log(`pc.icestate: ${pc.iceConnectionState}`);
    switch (pc.iceConnectionState) {
      case "connected":
        console.log("ICE CONNECTED");
        if (player) {
          streamerVideo.play().catch((e) => {
            console.log(e);
            ws.send(JSON.stringify({ type: "video_playing_error" }));
          });
        }
        break;

      case "disconnected":
        console.log("ICE DISCONNECTED");
        break;

      case "failed":
        console.log("ICE FAILED");
        //makeOffer();
        break;

      default:
        break;
    }
  });
}

function addTracks() {
  const streamTrackIds = stream.getTracks().map((t) => t.id);
  const senderTrackIds = pc
    .getSenders()
    .map((s) => s.track?.id)
    .filter(Boolean);

  if (streamTrackIds.every((id) => senderTrackIds.includes(id))) {
    return;
  }

  if (streamerVideo.mozCaptureStream) {
    stream = streamerVideo.mozCaptureStream();
  } else {
    stream = streamerVideo.captureStream();
  }

  stream.getTracks().forEach((track) => {
    console.log("**** TRACK ADDED *****");
    pc.addTrack(track, stream);
  });
}

async function sendStream(offer) {
  console.log("sending stream");
  if (!pc) {
    createPeerConnection();

    addTracks();

    pc.addTransceiver("video", { direction: "sendonly" });
    pc.addTransceiver("audio", { direction: "sendonly" });
  }

  makeOffer();
}

// retry with STUN/TURN if HOST/STUN fails
async function makeOffer() {
  console.log(`Making Offer: ${+selectionMenu.value}`);

  config = configs[+selectionMenu.value];
  console.log(`config: ${config}`);
  console.table(config);

  pc.setConfiguration(config);
  pc.restartIce();
  const offer = await pc.createOffer({ iceRestart: true });
  await pc.setLocalDescription(offer);
  //startTime = performance.now();
  ws.send(JSON.stringify({ type: "offer", offer }));
}

async function requestStream() {
  console.log("requesting stream");
  if (!pc) {
    createPeerConnection();

    streamerVideo.srcObject = remoteStream;

    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });
  }

  makeOffer();
}

function stopStream() {
  // stopStreamerStream();
  // stopPlayerStream();
  closePeerConnection();
}

ws.addEventListener("message", async (message) => {
  const data = JSON.parse(
    message.data instanceof Blob ? await message.data.text() : message.data,
  );

  if (data.type === "bye") {
    closePeerConnection();
    return;
  }

  if (!pc) {
    createPeerConnection();
  }

  switch (data.type) {
    case "candidate":
      if (data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
      break;

    case "offer":
      console.log("OFFER RECEIVED");
      if (streamer) {
        console.log("ADDING STREAM");
        addTracks();
      }
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: "answer", answer }));
      break;

    case "answer":
      console.log("ANSWER RECEIVED");
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      break;

    case "track":
      console.log(">>> TRACK RECEIVED <<<");
      break;

    case "video_playing_error":
      // console.log("PEER: Vide Playing Error");
      break;

    default:
      // console.log("ERROR! DATA TYPE IS NOT UNDERSTOOD");
      break;
  }
});

streamBtn.addEventListener("click", () => {
  streamer = true;
  optionsContainer.style.display = "none";
  inputContainer.style.display = "block";
  videoContainer.style.display = "none";
  streamerVideo.style.display = "none";
});

playBtn.addEventListener("click", () => {
  player = true;
  remoteStream = new MediaStream();
  optionsContainer.style.display = "none";
  inputContainer.style.display = "none";
  videoContainer.style.display = "flex";
  streamerVideo.style.display = "block";

  role.innerText = "Player";
  requestStream();
});

videoInput.addEventListener("change", async () => {
  optionsContainer.style.display = "none";
  inputContainer.style.display = "none";
  videoContainer.style.display = "flex";
  streamerVideo.style.display = "block";

  const file = videoInput.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    streamerVideo.src = url;
    muteVideoBtn.style.display = "inline";
    role.innerText = "Streamer";
  }

  await streamerVideo.play();
  if (streamerVideo.mozCaptureStream) {
    stream = streamerVideo.mozCaptureStream();
    routeAudio();
  } else {
    stream = streamerVideo.captureStream();
  }
});

stopStreamBtn.addEventListener("click", () => {
  optionsContainer.style.display = "block";
  inputContainer.style.display = "none";
  videoContainer.style.display = "none";
  streamerVideo.style.display = "none";

  stopStream();
});

muteAudioBtn.addEventListener("click", () => {
  if (streamerVideo.muted) {
    muteAudioBtn.innerText = "Mute Audio";
  } else {
    muteAudioBtn.innerText = "Unmute Audio";
  }

  streamerVideo.muted = !streamerVideo.muted;
});

muteVideoBtn.addEventListener("click", () => {
  if (stream && streamerVideo.paused) {
    streamerVideo.play();
    muteVideoBtn.innerText = "Mute Video";
  } else if (stream && !streamerVideo.paused) {
    streamerVideo.pause();
    muteVideoBtn.innerText = "Unmute Video";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f") {
    toggleFS();
  }
});

function toggleFS() {
  if (!document.fullscreenElement) {
    if (streamerVideo.style.display === "block") {
      streamerVideo.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullscreen) {
      document.mozCancelFullscreen();
    }
  }
}

window.addEventListener("beforeunload", () => {
  // console.log("closing peer connection...");
  closePeerConnection();
});

function closePeerConnection() {
  if (!pc) {
    return;
  }

  if (pc.signalingState === "closed") {
    pc = null;
    return;
  }

  ws.send(JSON.stringify({ type: "bye" })); // tell the peer the you are leaving

  pc.getSenders().forEach((sender) => {
    if (sender.track) {
      sender.track.stop();
    }
  });

  pc.getReceivers().forEach((receiver) => {
    if (receiver.track) {
      receiver.track.stop();
    }
  });

  pc.onicecandidate = null;
  pc.ontrack = null;
  pc.onconnectionstatechange = null;
  pc.oniceconnectionstatechange = null;

  pc.close();
  pc = null;

  // console.log("peer closed");
  // console.log("peer: ", pc);
}

recreatePcBtn.addEventListener("click", () => {
  // console.log(player ? "Player" : "Streamer");
  if (pc) {
    closePeerConnection();
  }
  if (player) {
    setTimeout(requestStream, 1000);
  } else if (streamer) {
    setTimeout(sendStream, 1000);
  }
});

makeOfferBtn.addEventListener("click", () => {
  // console.log(+selectionMenu.value);
  if (player) {
    requestStream();
  } else {
    sendStream();
  }
});

// Mozilla Firefox needs extra care
function routeAudio() {
  const audio = stream.getAudioTracks()[0];
  if (audio) {
    const audioStream = new MediaStream([audio]);

    const ac = new AudioContext();
    const source = ac.createMediaStreamSource(audioStream);
    source.connect(ac.destination);
  }
}
