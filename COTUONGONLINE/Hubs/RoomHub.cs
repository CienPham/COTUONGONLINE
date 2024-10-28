using Microsoft.AspNetCore.SignalR;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace COTUONGONLINE.Hubs
{
    public class RoomHub : Hub
    {
        public async Task JoinRoom(string roomId, string playerId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            await Clients.Group(roomId).SendAsync("ReceiveMessage", $"{playerId} joined the room.");
        }
    }
}
