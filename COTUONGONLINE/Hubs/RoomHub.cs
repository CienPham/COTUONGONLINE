using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace COTUONGONLINE.Hubs
{
    public class RoomHub : Hub
    {
        private static Dictionary<string, List<string>> rooms = new Dictionary<string, List<string>>();

        // Phương thức để tham gia phòng
        public async Task JoinRoom(string roomId, string playerId)
        {
            if (!rooms.ContainsKey(roomId))
            {
                rooms[roomId] = new List<string>();
            }

            rooms[roomId].Add(playerId);
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            // Gửi thông báo cho tất cả người chơi trong phòng khi có người tham gia
            await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId} has joined the room.");
        }

        // Phương thức rời phòng
        public async Task LeaveRoom(string roomId, string playerId)
        {
            if (rooms.ContainsKey(roomId))
            {
                rooms[roomId].Remove(playerId);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

                // Thông báo người chơi khác rằng người chơi đã rời phòng
                await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId} has left the room.");

                // Xóa phòng nếu không còn ai trong đó
                if (rooms[roomId].Count == 0)
                {
                    rooms.Remove(roomId);
                }
            }
        }


        // Phương thức để gửi tin nhắn trong phòng
        public async Task SendMessage(string roomId, string playerId, string message)
        {
            await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId}: {message}");
        }
    }
}
