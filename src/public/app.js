let userId = "";
let PEER_ID = "";
let peer;

let SERVER_ROOM_URL = "http://localhost:3000";
let SERVER_PEERJS_URL = "0.peerjs.com";

function reset() {
    userId = $("#user-id").val();
    updatePeerId(userId, "");
    leaveRoom(userId);
}

function joinRoom(roomId) {
    $.ajax({
        url: SERVER_ROOM_URL + "/rooms/join",
        type: "POST",
        data: {
            userId: userId,
            roomId: roomId
        },
        success: function (data) {
            console.log(data);

            let room = data.room;

            for (let i = 0; i < room.users.length; i++) {
                let user = room.users[i];
                let peerId = user._peerId;

                if (peerId === "" || PEER_ID === peerId) continue;

                connectToPeer(peer, peerId);
            }
        },
        error: function (data) {
            console.log(data);
        }
    });
}

function refreshRooms() {
    $.ajax({
        url: SERVER_ROOM_URL + "/rooms/list",
        type: "GET",
        success: function (data) {
            console.log(data);
            var rooms = data.rooms;

            $("#rooms").empty();
            for (let i = 0; i < rooms.length; i++) {
                $("#rooms").append("<li>" +
                    "<span>" + rooms[i].name + ": " + usersToString(rooms[i].users) + "</span>" +
                    "<input type=\"button\" value=\"Join\" onclick=\"joinRoom(" + rooms[i].id + ")\">" +
                    "</li>");
            }
        },
        error: function (data) {
            console.log(data);
        }
    });
}

function usersToString(users) {
    if (!users || users.length === 0) return "(Empty)";
    let result = "";
    for (let i = 0; i < users.length; i++) {
        result += users[i]._name;
        result += ", ";
    }
    return result;
}

function updatePeerId(userId, peerId, profileUrl) {
    console.log("Update peer Id: ", peerId)
    $.ajax({
        url: SERVER_ROOM_URL + "/users/update",
        type: "POST",
        data: {
            userId,
            peerId,
            profileUrl
        },
        success: function (data) {
            console.log(data);
        },
        error: function (data) {
            console.log(data);
        }
    });
}

function leaveRoom(userId) {
    $.ajax({
        url: SERVER_ROOM_URL + "/rooms/leave",
        type: "POST",
        data: {
            userId
        },
        success: function (data) {
            console.log(data);
        },
        error: function (data) {
            console.log(data);
        }
    });
}

// Peer methods
function connect() {
    if (PEER_ID !== "" && peer) {
        console.log("Already connected");
        return;
    }

    PEER_ID = $("#peer-id").val();
    userId = $("#user-id").val();

    /*peer = new Peer(PEER_ID, {
        host: '127.0.0.1',
        port: 3000,
        path: '/myapp',
        secure: false
    });*/
    peer = initPeer();
}

function initPeer() {
    let peer = new Peer({
        host: SERVER_PEERJS_URL,
        port: 443,
        path: "/",
        pingInterval: 5000,
    });

    peer.on('open', function (id) {
        PEER_ID = id;
        $("#peer-id").attr('value', id);

        // We need to update peerId on the server
        updatePeerId(userId, PEER_ID);
    });

    peer.on('connection', function (conn) {
        conn.on('data', function (data) {
            console.log('Received', data);
            $("#messages").append("<li>" + data + "</li>");
        });
    });

    peer.on('call', function (call) {
        getNavigatorMedia(function (stream) {
            call.answer(stream); // Answer the call with an A/V stream.
            call.on('stream', remoteStream => playStream(remoteStream));
        });
    });

    return peer;
}

function connectToPeer(peer, peerId) {
    // Connect to each peer to send data
    var conn = peer.connect(peerId);

    conn.on('open', function () {
        // Send messages
        conn.send('Hello from ' + userId);
    });

    // https://github.com/peers/peerjs/issues/636#issuecomment-832807568
    conn.on('close', () => {
        console.log("conn close event");
        handlePeerDisconnect(peer);
    });

    getNavigatorMedia(function (stream) {
        var call = peer.call(peerId, stream);
        call.on('stream', remoteStream => playStream(remoteStream));
        // peerjs bug prevents this from firing: https://github.com/peers/peerjs/issues/636
        call.on('close', () => {
            console.log("call close event");
            handlePeerDisconnect(peer);
        });
    });
}

function getNavigatorMedia(callback) {
    let userMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    userMedia({video: false, audio: true}, callback, function (err) {
        console.log('Failed to get local stream', err);
    });
}

function playStream(remoteStream, peerId) {
    // Show stream in some video/canvas element.
    var audio = $('<audio autoplay />').data("peer-id", peerId).appendTo('#audios');
    audio[0].srcObject = remoteStream;
}

function handlePeerDisconnect(peer) {
    // manually close the peer connections
    for (let conns in peer.connections) {
        peer.connections[conns].forEach((conn, index, array) => {
            console.log(`closing ${conn.connectionId} peerConnection (${index + 1}/${array.length})`, conn.peerConnection);
            conn.peerConnection.close();

            // close it using peerjs methods
            if (conn.close)
                conn.close();
        });
    }
}