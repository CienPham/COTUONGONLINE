// 1. Đầu tiên tạo file ComputerChessGame.js cho chế độ chơi với máy
import Vue from 'vue';
import axios from 'axios';

var matrix = [];
var app = new Vue({
    el: '#app',
    data: {
        chessNode: [],
        top: 0,
        left: 0,
        currentTurn: 'do',
        gameOver: false,
        winner: null,
        isRedKingAlive: true,
        isBlackKingAlive: true,
        isComputerMode: false,
        playerColor: 'do', // Mặc định người chơi là quân đỏ
        isComputerThinking: false
    },
    methods: {
        // Giữ lại tất cả methods từ code cũ và thêm các methods mới

        // Method kiểm tra xem có phải lượt của máy không
        isComputerTurn() {
            return this.isComputerMode && this.currentTurn !== this.playerColor;
        },

        // Method để máy thực hiện nước đi
        async makeComputerMove() {
            if (!this.isComputerTurn() || this.gameOver) return;

            this.isComputerThinking = true;
            try {
                const response = await axios({
                    url: '/api/chess/computer-move',
                    method: 'POST',
                    data: {
                        matrix: matrix,
                        computerColor: this.playerColor === 'do' ? 'den' : 'do'
                    }
                });

                const move = response.data;
                if (move) {
                    // Thực hiện nước đi của máy
                    const fromNode = matrix[move.fromi][move.fromj];
                    const toNode = matrix[move.toi][move.toj];

                    // Xử lý ăn quân nếu có
                    if (toNode.id !== "") {
                        const eatenPiece = document.getElementById(toNode.id);
                        if (eatenPiece) eatenPiece.style.display = "none";
                    }

                    // Di chuyển quân cờ
                    const piece = document.getElementById(fromNode.id);
                    piece.style.top = matrix[move.toi][move.toj].top + 'px';
                    piece.style.left = matrix[move.toi][move.toj].left + 'px';

                    // Cập nhật matrix
                    matrix[move.toi][move.toj].id = fromNode.id;
                    matrix[move.fromi][move.fromj].id = "";

                    // Kiểm tra chiến thắng
                    if (this.checkVictory() || this.checkKingsFaceToFace()) {
                        let winnerText = this.winner === 'do' ? 'ĐỎ' : 'ĐEN';
                        alert(`Người chơi ${winnerText} đã chiến thắng!`);
                    } else {
                        // Chuyển lượt
                        this.currentTurn = this.currentTurn === 'do' ? 'den' : 'do';
                    }
                }
            } catch (error) {
                console.error('Lỗi khi thực hiện nước đi của máy:', error);
            } finally {
                this.isComputerThinking = false;
            }
        },

        // Sửa đổi method dragEnd để hỗ trợ chế độ chơi với máy
        async dragEnd(event) {
            // Nếu đang ở chế độ chơi với máy và không phải lượt của người chơi
            if (this.isComputerMode && this.currentTurn !== this.playerColor) {
                console.log('Chưa đến lượt của bạn');
                return;
            }

            // Giữ nguyên code xử lý dragEnd cũ
            // ...

            // Sau khi người chơi đã đi xong, cho máy đi
            if (this.isComputerMode && !this.gameOver) {
                await this.makeComputerMove();
            }
        },

        // Method khởi tạo game với máy
        initComputerGame(playerPosition) {
            this.isComputerMode = true;
            this.playerColor = playerPosition;
            this.currentTurn = 'do'; // Luôn bắt đầu với quân đỏ

            // Nếu người chơi chọn quân đen (đi sau), cho máy đi trước
            if (this.playerColor === 'den') {
                this.makeComputerMove();
            }
        },

        // Sửa đổi getChessNode để khởi tạo chế độ chơi với máy
        async getChessNode() {
            const response = await axios({
                url: '/api/chess/loadChessBoard',
                method: 'GET',
                responseType: 'json',
            });

            this.chessNode = response.data.chessNode;
            matrix = response.data.maxtrix;

            // Kiểm tra URL params để xem có phải chế độ chơi với máy không
            const params = new URLSearchParams(window.location.search);
            const mode = params.get('mode');
            const playerPosition = params.get('position');

            if (mode === 'computer' && playerPosition) {
                this.initComputerGame(playerPosition);
            }
        }
    },
    mounted: function () {
        this.getChessNode();
    }
});