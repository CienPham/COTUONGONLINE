using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using System;

namespace COTUONGONLINE.Hubs
{
    public class RoomHub : Hub
    {
        private static readonly ConcurrentDictionary<string, List<string>> rooms = new ConcurrentDictionary<string, List<string>>();
        private static readonly ConcurrentDictionary<string, string> gameStates = new ConcurrentDictionary<string, string>();
        private static readonly ConcurrentDictionary<string, DateTime> lastActivityTime = new ConcurrentDictionary<string, DateTime>();
        private readonly ILogger<RoomHub> _logger;

        public RoomHub(ILogger<RoomHub> logger)
        {
            _logger = logger;
        }

        public async Task JoinRoom(string roomId, string playerId)
        {
            try
            {
                if (string.IsNullOrEmpty(roomId) || string.IsNullOrEmpty(playerId))
                {
                    throw new ArgumentException("RoomId và PlayerId không được để trống");
                }

                rooms.TryAdd(roomId, new List<string>());
                gameStates.TryAdd(roomId, "active");
                lastActivityTime.TryAdd(roomId, DateTime.UtcNow);

                var currentRoom = rooms[roomId];

                lock (currentRoom)
                {
                    if (currentRoom.Count >= 2)
                    {
                        throw new InvalidOperationException("Phòng đã đầy!");
                    }

                    if (currentRoom.Contains(playerId))
                    {
                        throw new InvalidOperationException("Người chơi đã ở trong phòng!");
                    }

                    currentRoom.Add(playerId);
                }

                await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId} đã vào phòng.");

                if (currentRoom.Count == 2)
                {
                    await Clients.Group(roomId).SendAsync("GameStart", new
                    {
                        RedPlayer = currentRoom[0],
                        BlackPlayer = currentRoom[1],
                        Message = "Game bắt đầu! Bên đỏ đi trước."
                    });
                }

                await Clients.Caller.SendAsync("RoomJoined", new
                {
                    RoomId = roomId,
                    PlayerId = playerId,
                    PlayerCount = currentRoom.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi tham gia phòng: {Message}", ex.Message);
                await Clients.Caller.SendAsync("ErrorMessage", ex.Message);
            }
        }

        public async Task SendGameOver(string roomId, string winner)
        {
            try
            {
                if (!rooms.ContainsKey(roomId))
                {
                    throw new InvalidOperationException("Phòng không tồn tại!");
                }

                gameStates[roomId] = "finished";
                var gameResult = new
                {
                    Winner = winner,
                    TimeStamp = DateTime.UtcNow,
                    RoomId = roomId
                };

                await Clients.Group(roomId).SendAsync("ReceiveGameOver", gameResult);
                await Clients.Group(roomId).SendAsync("ReceiveMessage", $"Game Over! {winner.ToUpper()} thắng!");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kết thúc game: {Message}", ex.Message);
                await Clients.Caller.SendAsync("ErrorMessage", ex.Message);
            }
        }

        public async Task LeaveRoom(string roomId, string playerId)
        {
            try
            {
                if (rooms.TryGetValue(roomId, out var currentRoom))
                {
                    lock (currentRoom)
                    {
                        currentRoom.Remove(playerId);
                    }

                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
                    await Clients.Group(roomId).SendAsync("PlayerLeft", new
                    {
                        PlayerId = playerId,
                        RemainingPlayers = currentRoom.Count
                    });

                    if (currentRoom.Count == 0)
                    {
                        rooms.TryRemove(roomId, out _);
                        gameStates.TryRemove(roomId, out _);
                        lastActivityTime.TryRemove(roomId, out _);
                    }
                    else
                    {
                        // Thông báo cho người chơi còn lại
                        await Clients.Group(roomId).SendAsync("ReceiveMessage", "Đối thủ đã rời phòng. Game kết thúc!");
                        gameStates[roomId] = "finished";
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi rời phòng: {Message}", ex.Message);
                await Clients.Caller.SendAsync("ErrorMessage", ex.Message);
            }
        }

        public async Task SendMessage(string roomId, string playerId, string message)
        {
            try
            {
                if (string.IsNullOrEmpty(message?.Trim()))
                {
                    throw new ArgumentException("Tin nhắn không được để trống");
                }

                if (!rooms.ContainsKey(roomId))
                {
                    throw new InvalidOperationException("Phòng không tồn tại!");
                }

                // Cập nhật thời gian hoạt động của phòng
                lastActivityTime[roomId] = DateTime.UtcNow;

                await Clients.Group(roomId).SendAsync("ReceiveMessage", new
                {
                    PlayerId = playerId,
                    Message = message,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi tin nhắn: {Message}", ex.Message);
                await Clients.Caller.SendAsync("ErrorMessage", ex.Message);
            }
        }

        public async Task SendChessMove(string roomId, string playerId, string move)
        {
            try
            {
                if (!rooms.ContainsKey(roomId))
                {
                    throw new InvalidOperationException("Phòng không tồn tại!");
                }

                if (gameStates[roomId] != "active")
                {
                    throw new InvalidOperationException("Game đã kết thúc!");
                }

                // Cập nhật thời gian hoạt động
                lastActivityTime[roomId] = DateTime.UtcNow;

                await Clients.Group(roomId).SendAsync("ReceiveChessMove", new
                {
                    PlayerId = playerId,
                    Move = move,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi gửi nước đi: {Message}", ex.Message);
                await Clients.Caller.SendAsync("ErrorMessage", ex.Message);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var roomId = rooms.FirstOrDefault(r => r.Value.Count > 0).Key;
            if (!string.IsNullOrEmpty(roomId))
            {
                await LeaveRoom(roomId, Context.ConnectionId);
            }
            await base.OnDisconnectedAsync(exception);
        }

        // Helper method để dọn dẹp các phòng không hoạt động
        private void CleanupInactiveRooms()
        {
            var inactiveRooms = lastActivityTime
                .Where(kvp => (DateTime.UtcNow - kvp.Value).TotalMinutes > 30)
                .Select(kvp => kvp.Key)
                .ToList();

            foreach (var roomId in inactiveRooms)
            {
                rooms.TryRemove(roomId, out _);
                gameStates.TryRemove(roomId, out _);
                lastActivityTime.TryRemove(roomId, out _);
                _logger.LogInformation($"Đã xóa phòng không hoạt động: {roomId}");
            }
        }
    }
}