package test;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
public class TestDownload {
    public static void main(String[] args) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://mztbiewiqjnairxnurfk.supabase.co/storage/v1/object/public/Images/5/1774010661593_Screenshot__271_.png";
        try {
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
            System.out.println("Status: " + response.getStatusCodeValue());
            System.out.println("Bytes: " + response.getBody().length);
        } catch(Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }
}
