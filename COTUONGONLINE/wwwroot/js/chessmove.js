﻿var matrix = [];
var app = new Vue({
    el: '#app',
    data: {
        chessNode: [],
        top: 0,
        left: 0

    },
    methods: {
        // Thêm hàm isPathClear
        isPathClear(nodeStart, nodeEnd, matrix) {
            // Kiểm tra đường đi ngang
            if (nodeStart.i === nodeEnd.i) {
                const minJ = Math.min(nodeStart.j, nodeEnd.j);
                const maxJ = Math.max(nodeStart.j, nodeEnd.j);
                for (let j = minJ + 1; j < maxJ; j++) {
                    if (matrix[nodeStart.i][j].id !== "") {
                        return false;
                    }
                }
            }
            // Kiểm tra đường đi dọc
            else if (nodeStart.j === nodeEnd.j) {
                const minI = Math.min(nodeStart.i, nodeEnd.i);
                const maxI = Math.max(nodeStart.i, nodeEnd.i);
                for (let i = minI + 1; i < maxI; i++) {
                    if (matrix[i][nodeStart.j].id !== "") {
                        return false;
                    }
                }
            }
            return true;
        },

        // Thêm hàm countPiecesBetween cho quân pháo
        countPiecesBetween(nodeStart, nodeEnd, matrix) {
            let count = 0;
            // Kiểm tra đường đi ngang
            if (nodeStart.i === nodeEnd.i) {
                const minJ = Math.min(nodeStart.j, nodeEnd.j);
                const maxJ = Math.max(nodeStart.j, nodeEnd.j);
                for (let j = minJ + 1; j < maxJ; j++) {
                    if (matrix[nodeStart.i][j].id !== "") {
                        count++;
                    }
                }
            }
            // Kiểm tra đường đi dọc
            else if (nodeStart.j === nodeEnd.j) {
                const minI = Math.min(nodeStart.i, nodeEnd.i);
                const maxI = Math.max(nodeStart.i, nodeEnd.i);
                for (let i = minI + 1; i < maxI; i++) {
                    if (matrix[i][nodeStart.j].id !== "") {
                        count++;
                    }
                }
            }
            return count;
        },

        getChessNode() {
            axios({
                url: '/api/chess/loadChessBoard',
                method: 'GET',
                responseType: 'json',

            }).then((response) => {
                this.chessNode = response.data.chessNode;
                matrix = response.data.maxtrix;

            });
        },
        getIndexByTopLef(top, left, matrix) {
            var obj = {};
            for (var i = 0; i < matrix.length; i++) {
                for (var j = 0; j < matrix[i].length; j++) {
                    if (Math.abs(matrix[i][j].top - top) < 20 && Math.abs(matrix[i][j].left - left) < 20) {
                        obj.i = i;
                        obj.j = j;
                        obj.id = matrix[i][j].id;
                        return obj;
                    }
                }
            }
            return null;
        },
        dragStart(event) {

            this.top = event.clientY;
            this.left = event.clientX;
        },
        dragEnd(event) {

            var id = event.currentTarget.id;
            var moveX = event.clientX - this.left;
            var moveY = event.clientY - this.top;
            moveX = moveX + event.currentTarget.offsetLeft;
            moveY = moveY + event.currentTarget.offsetTop;

            var nodeStart = this.getIndexByTopLef(event.currentTarget.offsetTop, event.currentTarget.offsetLeft, matrix);
            var nodeEnd = this.getIndexByTopLef(moveY, moveX, matrix);

            console.log('Di chuyển quân cờ:', id);
            console.log('Từ vị trí:', nodeStart);
            console.log('Đến vị trí:', nodeEnd);

            if (nodeEnd == null) {
                console.log('Lỗi: vị trí đích không hợp lệ');
                return;
            }

            var objRemove = null;
            // Xử lý quân mã
            if (id.indexOf('ma') >= 0) {
                console.log('===== Kiểm tra nước đi quân MÃ =====');
                var gapI = Math.abs(nodeEnd.i - nodeStart.i);
                var gapJ = Math.abs(nodeEnd.j - nodeStart.j);

                if (!((gapI == 1 && gapJ == 2) || (gapJ == 1 && gapI == 2))) {
                    console.log('Lỗi: Mã chỉ được đi nước đi hình chữ L (1-2)');
                    return;
                }
                //kiểm tra chặn mã
                if ((gapI == 1 && gapJ == 2) && (nodeEnd.j > nodeStart.j)) {
                    if (matrix[nodeStart.i][nodeStart.j + 1].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi ngang phải');
                        return;
                    }
                }
                if ((gapI == 1 && gapJ == 2) && (nodeEnd.j < nodeStart.j)) {
                    if (matrix[nodeStart.i][nodeStart.j - 1].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi ngang trái');
                        return;
                    }
                }
                if ((gapI == 2 && gapJ == 1) && (nodeEnd.i > nodeStart.i)) {
                    if (matrix[nodeStart.i + 1][nodeStart.j].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi xuống');
                        return;
                    }
                }
                if ((gapI == 2 && gapJ == 1) && (nodeEnd.i < nodeStart.i)) {
                    if (matrix[nodeStart.i - 1][nodeStart.j].id != "") {
                        console.log('Lỗi: Mã bị chặn khi đi lên');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Mã');
            }
            // Xử lý quân xe
            else if (id.indexOf('xe') >= 0) {
                console.log('===== Kiểm tra nước đi quân XE =====');
                if (!(nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j)) {
                    console.log('Lỗi: Xe chỉ được đi ngang hoặc dọc');
                    return;
                }
                if (!this.isPathClear(nodeStart, nodeEnd, matrix)) {
                    console.log('Lỗi: Đường đi của Xe bị cản bởi quân khác');
                    return;
                }
                console.log('Nước đi hợp lệ cho quân Xe');
            }
            // Xử lý quân pháo
            else if (id.indexOf('phao') >= 0) {
                console.log('===== Kiểm tra nước đi quân PHÁO =====');
                if (!(nodeStart.i === nodeEnd.i || nodeStart.j === nodeEnd.j)) {
                    console.log('Lỗi: Pháo chỉ được đi ngang hoặc dọc');
                    return;
                }
                var piecesBetween = this.countPiecesBetween(nodeStart, nodeEnd, matrix);
                if (nodeEnd.id !== "") { // Nếu điểm đến có quân (ăn quân)
                    if (piecesBetween !== 1) {
                        console.log('Lỗi: Pháo cần đúng 1 quân để ăn quân (hiện có ' + piecesBetween + ' quân)');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Pháo');
            }
            // Xử lý quân sĩ
            else if (id.indexOf('si') >= 0) {
                console.log('===== Kiểm tra nước đi quân SĨ =====');
                // Kiểm tra di chuyển chéo 1 ô
                if (!(Math.abs(nodeEnd.i - nodeStart.i) === 1 && Math.abs(nodeEnd.j - nodeStart.j) === 1)) {
                    console.log('Lỗi: Sĩ chỉ được đi chéo 1 ô');
                    return;
                }
                // Kiểm tra phạm vi cung
                if (id.indexOf('do') >= 0) { // Sĩ đỏ
                    if (!(nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Sĩ phải đi trong phạm vi cung');
                        return;
                    }
                } else { // Sĩ đen
                    if (!(nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Sĩ phải đi trong phạm vi cung');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Sĩ');
            }
            // Xử lý quân tượng
            else if (id.indexOf('tuong') >= 0 && id.indexOf('chutuong') < 0) {
                console.log('===== Kiểm tra nước đi quân TƯỢNG =====');
                // Kiểm tra di chuyển chéo 2 ô
                if (!(Math.abs(nodeEnd.i - nodeStart.i) === 2 && Math.abs(nodeEnd.j - nodeStart.j) === 2)) {
                    console.log('Lỗi: Tượng phải đi chéo 2 ô');
                    return;
                }
                // Kiểm tra chặn tượng
                var midPoint = matrix[(nodeStart.i + nodeEnd.i) / 2][(nodeStart.j + nodeEnd.j) / 2];
                if (midPoint.id !== "") {
                    console.log('Lỗi: Tượng bị chặn ở điểm giữa');
                    return;
                }
                // Kiểm tra qua sông
                if (id.indexOf('do') >= 0) { // Tượng đỏ
                    if (nodeEnd.i > 4) {
                        console.log('Lỗi: Tượng không được qua sông');
                        return;
                    }
                } else { // Tượng đen
                    if (nodeEnd.i < 5) {
                        console.log('Lỗi: Tượng không được qua sông');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Tượng');
            }
            // Xử lý quân tướng
            else if (id.indexOf('chutuong') >= 0) {
                console.log('===== Kiểm tra nước đi quân TƯỚNG =====');
                // Kiểm tra di chuyển 1 ô theo chiều dọc hoặc ngang
                if (!((Math.abs(nodeEnd.i - nodeStart.i) === 1 && nodeEnd.j === nodeStart.j) ||
                    (Math.abs(nodeEnd.j - nodeStart.j) === 1 && nodeEnd.i === nodeStart.i))) {
                    console.log('Lỗi: Tướng chỉ được đi 1 ô theo chiều dọc hoặc ngang');
                    return;
                }
                // Kiểm tra phạm vi cung
                if (id.indexOf('do') >= 0) { // Tướng đỏ
                    if (!(nodeEnd.i >= 0 && nodeEnd.i <= 2 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Tướng phải đi trong phạm vi cung');
                        return;
                    }
                } else { // Tướng đen
                    if (!(nodeEnd.i >= 7 && nodeEnd.i <= 9 && nodeEnd.j >= 3 && nodeEnd.j <= 5)) {
                        console.log('Lỗi: Tướng phải đi trong phạm vi cung');
                        return;
                    }
                }
                console.log('Nước đi hợp lệ cho quân Tướng');
            }
            // Xử lý quân tốt
            else if (id.indexOf('tot') >= 0) {
                console.log('===== Kiểm tra nước đi quân TỐT =====');
                // Kiểm tra quân tốt ĐEN
                if (id.indexOf('den') >= 0) {
                    console.log('Kiểm tra tốt ĐEN');
                    if (nodeStart.i < 5) { // Nếu quân tốt đen đã qua sông
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i - 1 || // Đi thẳng
                            nodeStart.i === nodeEnd.i && Math.abs(nodeStart.j - nodeEnd.j) === 1)) { // Đi ngang
                            console.log('Lỗi: Tốt đen đã qua sông chỉ được đi ngang 1 bước hoặc tiến 1 bước');
                            return;
                        }
                    } else {
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i - 1)) { // Chỉ được đi thẳng
                            console.log('Lỗi: Tốt đen chưa qua sông chỉ được đi thẳng tiến 1 bước');
                            return;
                        }
                    }
                }
                // Kiểm tra quân tốt ĐỎ
                else {
                    console.log('Kiểm tra tốt ĐỎ');
                    if (nodeStart.i > 4) { // Nếu quân tốt đỏ đã qua sông
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i + 1 || // Đi thẳng
                            nodeStart.i === nodeEnd.i && Math.abs(nodeStart.j - nodeEnd.j) === 1)) { // Đi ngang
                            console.log('Lỗi: Tốt đỏ đã qua sông chỉ được đi ngang 1 bước hoặc tiến 1 bước');
                            return;
                        }
                    } else {
                        if (!(nodeStart.j === nodeEnd.j && nodeEnd.i === nodeStart.i + 1)) { // Chỉ được đi thẳng
                            console.log('Lỗi: Tốt đỏ chưa qua sông chỉ được đi thẳng tiến 1 bước');
                            return;
                        }
                    }
                }
                console.log('Nước đi hợp lệ cho quân Tốt');
            }
            // Kiểm tra ăn quân
            if (nodeEnd.id != "") {
                // Kiểm tra ăn quân cùng màu
                if ((id.indexOf('do') >= 0 && nodeEnd.id.indexOf('do') >= 0) ||
                    (id.indexOf('den') >= 0 && nodeEnd.id.indexOf('den') >= 0)) {
                    console.log('Lỗi: Không thể ăn quân cùng màu');
                    return;
                } else {
                    console.log('Ăn quân:', nodeEnd.id);
                    objRemove = { id: nodeEnd.id };
                }
            }

            // xử lý gửi dữ liệu di chuyển lên server
            let params = new URL(document.location.toString()).searchParams;
            let roomId = params.get("roomId");
            var para = [{ id: id, fromi: nodeStart.i, fromj: nodeStart.j, toi: nodeEnd.i, toj: nodeEnd.j }];
            if (objRemove != null) {
                para.push(objRemove);
            }
            // Trong hàm dragEnd, sau phần gửi axios:
            axios({
                url: '/api/chess/move-check-node?roomId=' + roomId,
                method: 'Post',
                responseType: 'json',
                data: para
            }).then((response) => {
                // Cập nhật matrix
                matrix[nodeStart.i][nodeStart.j].id = "";
                matrix[nodeEnd.i][nodeEnd.j].id = id;

                // Cập nhật vị trí của quân cờ trên giao diện
                var obj = document.getElementById(id);
                obj.style.top = matrix[nodeEnd.i][nodeEnd.j].top + 'px';
                obj.style.left = matrix[nodeEnd.i][nodeEnd.j].left + 'px';

                // Nếu có ăn quân, ẩn quân bị ăn
                if (objRemove != null) {
                    var temp = document.getElementById(objRemove.id);
                    temp.style.display = "none";
                }
            });

        }
    },
    mounted: function () {
        this.getChessNode();
        let params = new URL(document.location.toString()).searchParams;
        let roomId = params.get("roomId");

        // Thay đổi đường dẫn đến Hub nếu cần
        var connection = new signalR.HubConnectionBuilder().withUrl("/roomHub?roomId=" + roomId).build();

        connection.on("ReceiveChessMove", function (message) {
            console.log(message);
            var response = JSON.parse(message);
            matrix[response[0].fromi][response[0].fromj].id = "";
            var nodeEnd = matrix[response[0].toi][response[0].toj];
            nodeEnd.id = response[0].id;

            var obj = document.getElementById(response[0].id);
            obj.style.top = nodeEnd.top + 'px';
            obj.style.left = nodeEnd.left + 'px';

            if (response.length > 1) {
                var temp = document.getElementById(response[1].id);
                temp.style.display = "none";
            }
        });

        connection.start().then(function () {
            console.log("Connected to SignalR Hub");
        }).catch(function (err) {
            return console.error(err.toString());
        });
    }

});


const connection = new signalR.HubConnectionBuilder()
    .withUrl("/roomHub")
    .build();

connection.start()
    .then(() => console.log("Connected to RoomHub"))
    .catch(err => console.error("Connection error: ", err));



document.getElementById("createRoom").addEventListener("click", async () => {
    const response = await fetch('/api/Room/create', { method: 'POST' });
    if (response.ok) {
        const data = await response.json();
        currentRoomId = data.roomId;
        document.getElementById("messages").innerText = `Room created. Room ID: ${currentRoomId}`;
    } else {
        console.error("Failed to create room:", response.statusText);
    }
});
let currentRoomId = null;
let playerId = prompt("Enter your Player ID:");

document.getElementById("joinRoom").addEventListener("click", async () => {
    currentRoomId = document.getElementById("roomIdInput").value;
    await connection.invoke("JoinRoom", currentRoomId, playerId);
});

document.getElementById("leaveRoom").addEventListener("click", async () => {
    if (currentRoomId) {
        await connection.invoke("LeaveRoom", currentRoomId, playerId);
        currentRoomId = null;
        document.getElementById("messages").innerText = "You have left the room.";
    }
});

document.getElementById("sendMessage").addEventListener("click", async () => {
    const message = document.getElementById("messageInput").value;
    if (currentRoomId && message) {
        await connection.invoke("SendMessage", currentRoomId, playerId, message);
        document.getElementById("messageInput").value = ""; // Xóa ô nhập tin nhắn
    }
});

connection.on("ReceiveMessage", (message) => {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML += `<p>${message}</p>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});