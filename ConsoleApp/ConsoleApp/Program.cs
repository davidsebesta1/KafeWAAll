using Newtonsoft.Json;
using System.Text;

namespace ConsoleApp
{
    class Program
    {
        private static readonly string apiUrl = "http://localhost:8082/api?cmd=getCoffeeUsage";
        private static readonly HttpClient client = new HttpClient();

        static async Task Main(string[] args)
        {
            // Start the monitoring task
            while (true)
            {
                await FetchAndDisplayCoffeeUsage("admin", "admin");
                Thread.Sleep(5000);
            }
        }

        private static async Task FetchAndDisplayCoffeeUsage(string username, string password)
        {
            try
            {
                // Prepare the login data
                var loginData = new { username, password };
                string json = JsonConvert.SerializeObject(loginData);
                StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

                // Send POST request with login data to fetch coffee usage
                HttpResponseMessage response = await client.PostAsync(apiUrl, content);
                response.EnsureSuccessStatusCode();

                // Read the response content
                string responseBody = await response.Content.ReadAsStringAsync();

                // Deserialize JSON to object
                var coffeeUsageList = JsonConvert.DeserializeObject<CoffeeUsage[]>(responseBody);

                // Clear the console
                Console.SetCursorPosition(0, 0);
                Console.WriteLine("Coffee Usage Data:");

                // Display the data
                foreach (CoffeeUsage usage in coffeeUsageList.OrderBy(n => n.LastName))
                {
                    Console.WriteLine($"{usage.FirstName} {usage.LastName} drank {usage.ItemName} - Amount: {usage.Amount}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching coffee usage data: {ex.Message}");
            }
        }
    }

    public class CoffeeUsage
    {
        public int UserID { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string ItemName { get; set; }
        public int Amount { get; set; }
    }
}
