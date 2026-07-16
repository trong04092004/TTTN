The RESTful API server for the JobHunter recruitment system, built with **Java Spring Boot**.

## 🛠 Tech Stack
* **Core:** Java 17, Spring Boot 3.
* **Database:** MySQL, Spring Data JPA.
* **Security:** Spring Security, JWT (OAuth2 Resource Server).
* **Real-time:** WebSocket (STOMP).
* **Others:** Gradle, Thymeleaf (for Email), Actuator.

## 🔗 Frontend Repository
The frontend client for this project can be found here:
👉 **[JobHunter Frontend Repository](https://github.com/tronghm/03-react-vite-jobhunter-master.git)**

## ⚙️ Prerequisites
* **Java JDK 17** or higher.
* **MySQL** running on port `3306`.
* **Gradle** (Wrapper included).

## 🚀 Configuration

Create a database named `jobhunter` in MySQL. Then, update your `src/main/resources/application.properties` file with the following environment variables:

### 1. Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/jobhunter
spring.datasource.username=root
spring.datasource.password=YOUR_DB_PASSWORD
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
2. JWT Configuration (Security)
You need a base64 encoded string (at least 64 bytes) for the secret key.
# Base64 Secret Key
tronghm.jwt.base64-secret=YOUR_SUPER_SECRET_BASE64_KEY_HERE

# Token Expiration (in seconds)
tronghm.jwt.access-token-validity-in-seconds=86400
tronghm.jwt.refresh-token-validity-in-seconds=8640000
3. File Upload Path
Specify an absolute path on your machine to store uploaded files (CVs, Logos). Note: Must start with file:///.

# Example for Windows: file:///D:/JobHunter/upload/
# Example for Linux/Mac: file:///home/user/jobhunter/upload/
tronghm.upload-file.base-uri=file:///YOUR/ABSOLUTE/PATH/HERE/
4. Email Configuration (Gmail)
Used for sending notifications and job alerts. Use an App Password, not your login password.

spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=YOUR_GMAIL_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
🏃 How to Run
Open the terminal in the project root and execute:
# Windows
gradlew.bat bootRun
# Mac/Linux
./gradlew bootRun
The server will start at http://localhost:8080.
