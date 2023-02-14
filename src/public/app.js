function refreshRooms() {
    $.ajax({
        url: "http://localhost:3000/rooms/list",
        type: "GET",
        success: function (data) {
            console.log(data);
            var rooms = data.rooms;

            $("#rooms").empty();
            for (let i = 0; i < rooms.length; i++) {
                $("#rooms").append("<li>" +
                    "<span>" + rooms[i].name + ": " + listUsers(rooms[i].users) + "</span>" +
                    "<input type=\"button\" value=\"Join\" onclick=\"joinRoom(" + rooms[i].id + ")\">" +
                    "</li>");
            }
        },
        error: function (data) {
            console.log(data);
        }
    });
}

function listUsers(users) {
    if (!users || users.length === 0) return "(Empty)";
    let result = "";
    for (let i = 0; i < users.length; i++) {
        result += users[i]._name;
        result += ", ";
    }
    return result;
}

function updatePeerId(userId, peerId) {
    console.log("Update peer Id: ", peerId)
    $.ajax({
        url: "http://localhost:3000/users/update",
        type: "POST",
        data: {
            userId,
            peerId
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