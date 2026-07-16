package vn.tronghm.jobhunter.config;

import net.datafaker.Faker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tronghm.jobhunter.domain.*;
import vn.tronghm.jobhunter.repository.*;
import vn.tronghm.jobhunter.util.constant.GenderEnum;
import vn.tronghm.jobhunter.util.constant.LevelEnum;
import vn.tronghm.jobhunter.util.constant.ResumeStateEnum;

import org.springframework.core.io.ClassPathResource;

import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;
import javax.imageio.ImageIO;

@Service
public class DataSeeder {

  private final CompanyRepository companyRepository;
  private final UserRepository userRepository;
  private final JobRepository jobRepository;
  private final SkillRepository skillRepository;
  private final ResumeRepository resumeRepository;
  private final RoleRepository roleRepository;
  private final PermissionRepository permissionRepository;
  private final PasswordEncoder passwordEncoder;

  @Value("${tronghm.upload-file.base-uri}")
  private String baseURI;

  public DataSeeder(CompanyRepository companyRepository, UserRepository userRepository,
      JobRepository jobRepository, SkillRepository skillRepository,
      ResumeRepository resumeRepository, RoleRepository roleRepository,
      PermissionRepository permissionRepository, PasswordEncoder passwordEncoder) {
    this.companyRepository = companyRepository;
    this.userRepository = userRepository;
    this.jobRepository = jobRepository;
    this.skillRepository = skillRepository;
    this.resumeRepository = resumeRepository;
    this.roleRepository = roleRepository;
    this.permissionRepository = permissionRepository;
    this.passwordEncoder = passwordEncoder;
  }

  /**
   * Resolve the company's logo: copy the bundled real logo from
   * classpath:seed-logos/{slug}.png if one exists, composited onto a 200x200
   * transparent canvas so every logo renders at a consistent size regardless
   * of its original aspect ratio. Falls back to a generated initials image
   * when no real logo was bundled for that company.
   */
  private String resolveCompanyLogo(String companyName, String bgColorHex) {
    String fileName = companyName.toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-") + ".png";
    ClassPathResource resource = new ClassPathResource("seed-logos/" + fileName);
    if (!resource.exists()) {
      return generateLogoImage(companyName, bgColorHex);
    }
    try {
      URI dirUri = new URI(baseURI + "company");
      Path dirPath = Paths.get(dirUri);
      Files.createDirectories(dirPath);

      BufferedImage source;
      try (InputStream in = resource.getInputStream()) {
        source = ImageIO.read(in);
      }

      int size = 200;
      int padding = 20;
      int maxDim = size - padding * 2;
      double scale = Math.min((double) maxDim / source.getWidth(), (double) maxDim / source.getHeight());
      int drawWidth = (int) Math.round(source.getWidth() * scale);
      int drawHeight = (int) Math.round(source.getHeight() * scale);

      BufferedImage canvas = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
      Graphics2D g2d = canvas.createGraphics();
      g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
      g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g2d.drawImage(source, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight, null);
      g2d.dispose();

      URI fileUri = new URI(baseURI + "company/" + fileName);
      Path filePath = Paths.get(fileUri);
      ImageIO.write(canvas, "png", filePath.toFile());

      System.out.println("    Copied real logo: " + fileName);
      return fileName;
    } catch (Exception e) {
      System.err.println("    Failed to load bundled logo for " + companyName + ": " + e.getMessage());
      return generateLogoImage(companyName, bgColorHex);
    }
  }

  /**
   * Generate a professional-looking logo image with company initials,
   * save it to the upload/company folder, and return the filename.
   * Used as a fallback when no real logo was bundled for a company.
   */
  private String generateLogoImage(String companyName, String bgColorHex) {
    try {
      // Ensure the company upload directory exists
      URI dirUri = new URI(baseURI + "company");
      Path dirPath = Paths.get(dirUri);
      Files.createDirectories(dirPath);

      // Build initials from company name (max 2-3 chars)
      String[] words = companyName.split("\\s+");
      StringBuilder initials = new StringBuilder();
      for (String w : words) {
        if (!w.isEmpty() && Character.isUpperCase(w.charAt(0))) {
          initials.append(w.charAt(0));
        }
        if (initials.length() >= 2) break;
      }
      if (initials.length() == 0) {
        initials.append(companyName.substring(0, Math.min(2, companyName.length())).toUpperCase());
      }

      // Create a 200x200 image
      int size = 200;
      BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
      Graphics2D g2d = img.createGraphics();
      g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

      // Fill background with company color
      Color bg = Color.decode(bgColorHex);
      g2d.setColor(bg);
      g2d.fillRect(0, 0, size, size);

      // Draw initials in white
      g2d.setColor(Color.WHITE);
      Font font = new Font("SansSerif", Font.BOLD, 72);
      g2d.setFont(font);
      FontMetrics fm = g2d.getFontMetrics();
      String text = initials.toString();
      int textWidth = fm.stringWidth(text);
      int textHeight = fm.getAscent();
      g2d.drawString(text, (size - textWidth) / 2, (size + textHeight) / 2 - fm.getDescent());
      g2d.dispose();

      // Save to file
      String fileName = companyName.toLowerCase().replaceAll("[^a-z0-9]", "-").replaceAll("-+", "-") + ".png";
      URI fileUri = new URI(baseURI + "company/" + fileName);
      Path filePath = Paths.get(fileUri);
      ImageIO.write(img, "png", filePath.toFile());

      System.out.println("    Generated logo: " + fileName);
      return fileName;
    } catch (Exception e) {
      System.err.println("    Failed to generate logo for " + companyName + ": " + e.getMessage());
      // Return a fallback name — the image won't exist but at least won't crash
      return "default-logo.png";
    }
  }

  /**
   * Generate a simple default logo as fallback.
   */
  private void generateDefaultLogo() {
    try {
      URI dirUri = new URI(baseURI + "company");
      Path dirPath = Paths.get(dirUri);
      Files.createDirectories(dirPath);

      int size = 200;
      BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
      Graphics2D g2d = img.createGraphics();
      g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
      g2d.setColor(new Color(100, 100, 100));
      g2d.fillRect(0, 0, size, size);
      g2d.setColor(Color.WHITE);
      g2d.setFont(new Font("SansSerif", Font.BOLD, 60));
      FontMetrics fm = g2d.getFontMetrics();
      String text = "JH";
      int textWidth = fm.stringWidth(text);
      g2d.drawString(text, (size - textWidth) / 2, (size + fm.getAscent()) / 2 - fm.getDescent());
      g2d.dispose();

      URI fileUri = new URI(baseURI + "company/default-logo.png");
      Path filePath = Paths.get(fileUri);
      ImageIO.write(img, "png", filePath.toFile());
    } catch (Exception e) {
      System.err.println("    Failed to create default logo: " + e.getMessage());
    }
  }

  @Transactional
  public void seedData() {
    Faker faker = new Faker();
    Random random = new Random();
    String defaultPassword = passwordEncoder.encode("123456");

    System.out.println(">>> START SEEDING RICH DATA...");

    // Generate fallback logo
    generateDefaultLogo();

    // 1. Seed Skills
    String[] skillNames = {
        "Java", "Python", "JavaScript", "TypeScript", "React", "Angular", "Vue.js", "Node.js",
        "Spring Boot", "Django", "Flask", "Ruby on Rails", "C#", ".NET", "PHP", "Laravel",
        "Go", "Rust", "Swift", "Kotlin", "Android", "iOS", "Flutter", "React Native",
        "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Git"
    };

    List<Skill> skills = new ArrayList<>();
    for (String name : skillNames) {
      Skill skill = new Skill();
      skill.setName(name);
      skill.setCreatedBy("system");
      skill.setCreatedAt(Instant.now());
      skills.add(skill);
    }
    skills = skillRepository.saveAll(skills);
    System.out.println(">>> Seeded " + skills.size() + " Skills");

    // 2. Seed Companies (Detailed, Real-like Data)
    // Format: {name, description, address, bgColor for logo}
    String[][] companyData = {
        {"FPT Software",
         "Công ty công nghệ thông tin lớn nhất Việt Nam, chuyên cung cấp các dịch vụ phát triển phần mềm, tư vấn CNTT và chuyển đổi số toàn cầu. Với hơn 30.000 nhân viên tại 29 quốc gia, FPT Software là đối tác tin cậy của nhiều tập đoàn Fortune 500. Môi trường làm việc năng động, chuyên nghiệp, cơ hội onsite tại Nhật Bản, Mỹ, Châu Âu.",
         "Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội",
         "#E65100"},
        {"VNG Corporation",
         "Kỳ lân công nghệ hàng đầu Việt Nam, nổi tiếng với hệ sinh thái sản phẩm đa dạng: Zalo (ứng dụng nhắn tin quốc dân), ZaloPay, Zing MP3. VNG quy tụ hơn 3.500 nhân sự công nghệ giỏi nhất, là nơi sinh viên IT Việt Nam mơ ước được làm việc.",
         "Z06 Đường số 13, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh",
         "#1565C0"},
        {"Viettel Group",
         "Tập đoàn Công nghiệp - Viễn thông Quân đội, nhà mạng viễn thông lớn nhất Việt Nam với hơn 100 triệu thuê bao. Viettel đầu tư mạnh mẽ vào R&D, phát triển 5G, AI, Cloud Computing và các giải pháp chuyển đổi số cho chính phủ và doanh nghiệp.",
         "Lô D26, Khu đô thị mới Cầu Giấy, Phường Yên Hòa, Quận Cầu Giấy, Hà Nội",
         "#D32F2F"},
        {"Shopee Vietnam",
         "Nền tảng thương mại điện tử hàng đầu Đông Nam Á và Đài Loan thuộc tập đoàn Sea Group. Với hàng trăm triệu lượt truy cập mỗi tháng, Shopee mang đến trải nghiệm mua sắm trực tuyến tuyệt vời. Đội ngũ Engineering giải quyết các bài toán hệ thống lớn (high traffic, real-time).",
         "Tòa nhà Saigon Centre Tower 2, 67 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
         "#EE4D2D"},
        {"Tiki",
         "Hệ sinh thái thương mại điện tử đáng tin cậy nhất Việt Nam với phương châm 'Tiki - Tốt và Nhanh'. Cam kết 100% hàng chính hãng, giao hàng trong 2h với TikiNOW. Đội ngũ kỹ sư phát triển nền tảng logistics thông minh và hệ thống recommendation engine tiên tiến.",
         "52 Út Tịch, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh",
         "#1A94FF"},
        {"MoMo",
         "Ví điện tử số 1 Việt Nam với hơn 40 triệu người dùng, cung cấp giải pháp thanh toán di động toàn diện: chuyển tiền, thanh toán hóa đơn, mua sắm online. MoMo liên tục đổi mới công nghệ trong lĩnh vực Fintech, áp dụng AI và Big Data vào trải nghiệm người dùng.",
         "Tòa nhà Phú Mỹ Hưng, 8 Hoàng Văn Thái, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh",
         "#A50064"},
        {"KMS Technology",
         "Công ty phát triển phần mềm và tư vấn công nghệ 100% vốn Mỹ, chuyên cung cấp dịch vụ offshore cho thị trường Bắc Mỹ. KMS nổi tiếng với văn hóa công ty xuất sắc, chú trọng phát triển con người, nhiều năm liền đạt 'Nơi làm việc tốt nhất Việt Nam'.",
         "2 Tản Viên, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh",
         "#00695C"},
        {"NashTech",
         "Tập đoàn công nghệ toàn cầu có trụ sở tại Anh Quốc, cung cấp dịch vụ phát triển phần mềm, tư vấn IT và outsourcing. NashTech áp dụng quy trình chuẩn quốc tế (ISO, CMMI), đào tạo nhân sự bài bản và có nhiều dự án với khách hàng tại Châu Âu, Úc, Nhật.",
         "Tòa nhà Etown Central, 11 Đoàn Văn Bơ, Phường 13, Quận 4, TP. Hồ Chí Minh",
         "#283593"},
        {"Teko Vietnam",
         "Công ty công nghệ phát triển các giải pháp Retail-Tech (bán lẻ công nghệ) cho hệ sinh thái Phong Vũ và VNPay. Teko xây dựng nền tảng ERP, E-commerce, Loyalty, Payment xử lý hàng triệu giao dịch mỗi ngày. Stack công nghệ hiện đại: Golang, Kubernetes, Kafka.",
         "Tòa nhà VNPay, 22 Láng Hạ, Quận Đống Đa, Hà Nội",
         "#FF6F00"},
        {"CMC Corporation",
         "Tập đoàn công nghệ hàng đầu Việt Nam cung cấp giải pháp CNTT toàn diện: Cloud, Cybersecurity, SI (System Integration), phát triển phần mềm. CMC có mặt tại 7 quốc gia với hơn 4.000 nhân viên, là đối tác chiến lược của Samsung, Microsoft, AWS.",
         "Tòa nhà CMC Tower, Số 11 Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội",
         "#0D47A1"},
        {"Grab Vietnam",
         "Siêu ứng dụng hàng đầu Đông Nam Á với hơn 300 triệu lượt tải. Grab cung cấp dịch vụ gọi xe, giao đồ ăn (GrabFood), thanh toán (GrabPay), giao hàng (GrabExpress). Đội ngũ Engineering tại Việt Nam phát triển các hệ thống xử lý hàng triệu requests/giây.",
         "Tòa nhà Mapletree Business Centre, 1060 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh",
         "#00B14F"},
        {"ZaloPay",
         "Nền tảng thanh toán di động thuộc hệ sinh thái VNG, hỗ trợ thanh toán QR code, chuyển tiền liên ngân hàng, mua sắm trực tuyến. ZaloPay áp dụng công nghệ bảo mật tiên tiến (tokenization, biometric) và xử lý giao dịch real-time với độ tin cậy 99.99%.",
         "Tòa nhà VNG Campus, Khu chế xuất Tân Thuận, Quận 7, TP. Hồ Chí Minh",
         "#0068FF"},
        {"VNPay",
         "Công ty hàng đầu trong lĩnh vực thanh toán điện tử tại Việt Nam, xây dựng cổng thanh toán kết nối hơn 40 ngân hàng và 150.000 điểm chấp nhận thanh toán. VNPay phát triển các ứng dụng ngân hàng số (VNPay QR, VnShop) phục vụ hàng chục triệu người dùng.",
         "Số 22 Láng Hạ, Phường Láng Hạ, Quận Đống Đa, Hà Nội",
         "#005BAA"},
        {"Got It Vietnam",
         "Startup công nghệ AI tiên phong tại Thung lũng Silicon (Mỹ), với đội ngũ R&D chính tại TP.HCM. Got It phát triển nền tảng Knowledge-as-a-Service sử dụng NLP và Machine Learning để tự động hóa quy trình hỗ trợ khách hàng cho các doanh nghiệp Fortune 500.",
         "Tòa nhà TNR Tower, 180-192 Nguyễn Công Trứ, Quận 1, TP. Hồ Chí Minh",
         "#6A1B9A"},
        {"Axon Active Vietnam",
         "Công ty phát triển phần mềm Agile/Scrum của Thụy Sĩ với hơn 15 năm kinh nghiệm. Môi trường làm việc mở, flat hierarchy, chú trọng đào tạo (Agile Coach, Tech Lead program). Dự án đa dạng trong các lĩnh vực: Insurance, Healthcare, Banking tại Châu Âu.",
         "39B Trường Sơn, Phường 4, Quận Tân Bình, TP. Hồ Chí Minh",
         "#2E7D32"},
        {"Google",
         "Tập đoàn công nghệ đa quốc gia hàng đầu thế giới, sở hữu công cụ tìm kiếm phổ biến nhất toàn cầu cùng hệ sinh thái sản phẩm đồ sộ: Gmail, YouTube, Google Cloud, Android. Văn phòng đại diện tại Việt Nam tập trung phát triển kinh doanh, quảng cáo số và hỗ trợ hệ sinh thái nhà phát triển. Môi trường làm việc đẳng cấp quốc tế, văn hóa đổi mới sáng tạo nổi tiếng toàn cầu.",
         "Tòa nhà CornerStone, 16 Phan Chu Trinh, Quận Hoàn Kiếm, Hà Nội",
         "#4285F4"},
        {"Microsoft",
         "Tập đoàn phần mềm và điện toán đám mây lớn nhất thế giới, đứng sau Windows, Office 365, Azure và GitHub. Microsoft Việt Nam đồng hành cùng quá trình chuyển đổi số quốc gia, hợp tác với hàng nghìn doanh nghiệp và cơ quan chính phủ. Cơ hội tiếp cận công nghệ AI, Cloud tiên tiến nhất thế giới.",
         "Tòa nhà Pacific Place, 83B Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội",
         "#00A4EF"},
        {"Amazon Web Services Vietnam",
         "Nền tảng điện toán đám mây lớn nhất thế giới thuộc tập đoàn Amazon, phục vụ hàng triệu khách hàng doanh nghiệp toàn cầu. Đội ngũ AWS tại Việt Nam hỗ trợ khách hàng triển khai hạ tầng cloud, giải pháp AI/ML và chuyển đổi số quy mô lớn. Văn hóa 'Customer Obsession' và tiêu chuẩn kỹ thuật khắt khe hàng đầu ngành.",
         "Tòa nhà Bitexco Financial Tower, 2 Hải Triều, Quận 1, TP. Hồ Chí Minh",
         "#FF9900"},
        {"IBM Vietnam",
         "Tập đoàn công nghệ lâu đời và uy tín hàng đầu thế giới, tiên phong trong các lĩnh vực AI (Watson), Hybrid Cloud, Quantum Computing và tư vấn chuyển đổi số doanh nghiệp. IBM Việt Nam có đội ngũ kỹ sư và tư vấn giàu kinh nghiệm, phục vụ các khách hàng doanh nghiệp lớn trong nhiều ngành.",
         "Tòa nhà Pearl Plaza, 561A Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh",
         "#006699"},
        {"Samsung Electronics Vietnam",
         "Nhà máy sản xuất điện thoại và thiết bị điện tử lớn nhất của Samsung trên toàn cầu, đóng góp hơn 20% tổng kim ngạch xuất khẩu Việt Nam. Samsung Electronics Vietnam đầu tư mạnh vào Trung tâm R&D tại Hà Nội, tuyển dụng hàng nghìn kỹ sư phần mềm, phần cứng, AI mỗi năm với chế độ đãi ngộ hấp dẫn.",
         "Khu công nghiệp Yên Bình, Phổ Yên, Thái Nguyên",
         "#1428A0"},
        {"Intel Products Vietnam",
         "Nhà máy lắp ráp và kiểm định chip bán dẫn lớn nhất trong hệ thống toàn cầu của Intel, đặt tại Khu Công nghệ cao TP.HCM. Intel Products Vietnam là mắt xích quan trọng trong chuỗi cung ứng bán dẫn thế giới, mang đến cơ hội làm việc trong ngành công nghiệp vi mạch bán dẫn hàng đầu.",
         "Lô I2, Đường D1, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh",
         "#0071C5"},
        {"LG Electronics Vietnam",
         "Tổ hợp sản xuất thiết bị điện tử, điện lạnh và màn hình lớn nhất Đông Nam Á của tập đoàn LG Hàn Quốc. LG Electronics Vietnam phát triển đội ngũ kỹ sư R&D phần mềm nhúng, tự động hóa và kiểm thử chất lượng, phục vụ thị trường xuất khẩu toàn cầu.",
         "Khu công nghiệp Tràng Duệ, An Dương, Hải Phòng",
         "#A50034"},
        {"Bosch Global Software Technologies",
         "Trung tâm phát triển phần mềm toàn cầu của tập đoàn Bosch (Đức), chuyên về giải pháp IoT, ô tô thông minh (Automotive), Industry 4.0. Bosch GS Việt Nam quy tụ hàng nghìn kỹ sư phần mềm chất lượng cao, làm việc trực tiếp với các đội ngũ kỹ thuật tại Đức, Mỹ, Ấn Độ.",
         "Tòa nhà Etown 2, 364 Cộng Hòa, Quận Tân Bình, TP. Hồ Chí Minh",
         "#EA0016"},
        {"Panasonic Vietnam",
         "Tập đoàn điện tử đa quốc gia Nhật Bản với lịch sử hơn 100 năm, sản xuất và phát triển các giải pháp gia dụng, công nghiệp, ô tô thông minh. Panasonic Vietnam đầu tư vào R&D phần mềm nhúng và IoT, mang đến môi trường làm việc chuẩn Nhật Bản kỷ luật, chuyên nghiệp.",
         "Khu công nghiệp Thăng Long II, Yên Mỹ, Hưng Yên",
         "#003087"},
        {"VinAI",
         "Viện nghiên cứu Trí tuệ nhân tạo hàng đầu Việt Nam thuộc Tập đoàn Vingroup, quy tụ các chuyên gia AI được đào tạo tại các trường đại học và phòng lab hàng đầu thế giới. VinAI tập trung nghiên cứu Computer Vision, NLP, tự lái với nhiều công trình được công bố tại các hội nghị AI quốc tế danh giá.",
         "Tòa nhà Vincom Center Landmark 81, 720A Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh",
         "#E31E24"},
        {"Sun Asterisk Vietnam",
         "Công ty công nghệ Nhật Bản (Sun*) chuyên tư vấn và phát triển sản phẩm số (Digital Creative Studio) cho các startup và doanh nghiệp lớn tại Nhật Bản. Sun* nổi bật với mô hình BrSE kết nối kỹ sư Việt Nam - khách hàng Nhật, văn hóa sáng tạo và tốc độ phát triển sản phẩm nhanh.",
         "Tòa nhà Sun* Building, Ngõ 15 Duy Tân, Quận Cầu Giấy, Hà Nội",
         "#DA291C"},
        {"Rikkeisoft",
         "Công ty công nghệ Việt Nam với thế mạnh về thị trường Nhật Bản, chuyên phát triển phần mềm, giải pháp AI, Blockchain và chuyển đổi số. Rikkeisoft nổi tiếng với văn hóa doanh nghiệp trẻ trung, nhiều hoạt động gắn kết nhân viên và lộ trình thăng tiến rõ ràng cho kỹ sư mới ra trường.",
         "Tòa nhà Rikkeisoft, Số 51 Lê Đại Hành, Quận Hai Bà Trưng, Hà Nội",
         "#E4002B"},
        {"Sendo",
         "Sàn thương mại điện tử thuần Việt thuộc FPT, tập trung phục vụ người dùng tại các tỉnh thành ngoài khu vực trung tâm. Đội ngũ kỹ sư Sendo xây dựng các hệ thống xử lý đơn hàng, thanh toán, logistics quy mô lớn, đối mặt với các bài toán tối ưu hiệu năng và trải nghiệm người dùng đặc thù thị trường Việt Nam.",
         "Tòa nhà Sonatus, 15 Lê Thánh Tôn, Quận 1, TP. Hồ Chí Minh",
         "#E52E04"},
        {"Base.vn",
         "Nền tảng quản trị và điều hành doanh nghiệp (SaaS) 'Make in Vietnam' được hàng nghìn doanh nghiệp tin dùng. Base.vn phát triển hệ sinh thái ứng dụng quản lý nhân sự, công việc, quy trình với tốc độ tăng trưởng nhanh, môi trường startup năng động, đề cao tư duy sản phẩm.",
         "Tòa nhà Charmvit Tower, 117 Trần Duy Hưng, Quận Cầu Giấy, Hà Nội",
         "#2F80ED"},
        {"Haravan",
         "Nền tảng công nghệ bán hàng đa kênh (Omnichannel Commerce) hàng đầu Việt Nam, hỗ trợ hàng chục nghìn nhà bán hàng vận hành website, POS, kết nối sàn TMĐT. Haravan xây dựng sản phẩm SaaS phục vụ cộng đồng kinh doanh online lớn nhất Việt Nam, với đội ngũ kỹ sư trẻ, giàu nhiệt huyết.",
         "Tòa nhà Flemington, 182 Lê Đại Hành, Quận 11, TP. Hồ Chí Minh",
         "#00B14F"}
    };

    List<Company> companies = new ArrayList<>();
    for (int i = 0; i < companyData.length; i++) {
      Company c = new Company();
      c.setName(companyData[i][0]);
      c.setDescription(companyData[i][1]);
      c.setAddress(companyData[i][2]);
      // Copy the bundled real logo (falls back to a generated one if missing)
      String logoFile = resolveCompanyLogo(companyData[i][0], companyData[i][3]);
      c.setLogo(logoFile);
      c.setCreatedBy("system");
      c.setCreatedAt(Instant.now());
      companies.add(c);
    }

    companies = companyRepository.saveAll(companies);
    System.out.println(">>> Seeded " + companies.size() + " Companies");

    List<Permission> allPermissions = permissionRepository.findAll();

    // 3. Seed Roles (Get existing or create)
    Role hrRole = roleRepository.findByName("HR");
    if (hrRole == null) {
      hrRole = new Role();
      hrRole.setName("HR");
      hrRole.setDescription("Human Resources");
      hrRole.setActive(true);
      hrRole.setCreatedBy("system");
      hrRole.setCreatedAt(Instant.now());
      
      List<Permission> hrPermissions = allPermissions.stream()
          .filter(p -> p.getModule().equals("JOBS") || p.getModule().equals("RESUMES")
              || p.getModule().equals("FILES") || p.getModule().equals("NOTIFICATIONS")
              || p.getModule().equals("SKILLS")
              || (p.getModule().equals("COMPANIES") && p.getMethod().equals("GET")))
          .collect(Collectors.toList());
      hrRole.setPermissions(hrPermissions);
      hrRole = roleRepository.save(hrRole);
    }

    Role userRole = roleRepository.findByName("USER");
    if (userRole == null) {
      userRole = new Role();
      userRole.setName("USER");
      userRole.setDescription("Normal User / Candidate");
      userRole.setActive(true);
      userRole.setCreatedBy("system");
      userRole.setCreatedAt(Instant.now());
      
      List<Permission> userPermissions = allPermissions.stream()
          .filter(p -> p.getModule().equals("NOTIFICATIONS") || p.getModule().equals("FILES")
              || p.getModule().equals("SUBSCRIBERS")
              || (p.getModule().equals("RESUMES") && (p.getMethod().equals("POST") || p.getMethod().equals("GET")))
              || (p.getModule().equals("COMPANIES") && p.getMethod().equals("GET"))
              || (p.getModule().equals("JOBS") && p.getMethod().equals("GET"))
              || (p.getModule().equals("SKILLS") && p.getMethod().equals("GET")))
          .collect(Collectors.toList());
      userRole.setPermissions(userPermissions);
      userRole = roleRepository.save(userRole);
    }

    // 4. Seed Users (HRs and Candidates)
    List<User> users = new ArrayList<>();

    for (int i = 0; i < 30; i++) {
      User hr = new User();
      hr.setName(faker.name().fullName());
      hr.setEmail("hr" + i + "@gmail.com");
      hr.setPassword(defaultPassword);
      hr.setAge(random.nextInt(35) + 25);
      hr.setGender(GenderEnum.values()[random.nextInt(GenderEnum.values().length)]);
      hr.setAddress(faker.address().city());
      hr.setRole(hrRole);
      hr.setCompany(companies.get(random.nextInt(companies.size())));
      hr.setCreatedBy("system");
      hr.setCreatedAt(Instant.now());
      users.add(hr);
    }

    List<User> candidates = new ArrayList<>();
    for (int i = 0; i < 50; i++) {
      User candidate = new User();
      candidate.setName(faker.name().fullName());
      candidate.setEmail("candidate" + i + "@gmail.com");
      candidate.setPassword(defaultPassword);
      candidate.setAge(random.nextInt(20) + 18);
      candidate.setGender(GenderEnum.values()[random.nextInt(GenderEnum.values().length)]);
      candidate.setAddress(faker.address().city());
      candidate.setRole(userRole);
      candidate.setCreatedBy("system");
      candidate.setCreatedAt(Instant.now());
      users.add(candidate);
      candidates.add(candidate);
    }

    users = userRepository.saveAll(users);
    System.out.println(">>> Seeded " + users.size() + " Users (HRs & Candidates)");

    // 5. Seed Jobs
    String[] jobTitles = {
        "Lập trình viên Backend Java (Spring Boot)",
        "Chuyên viên phân tích dữ liệu (Data Analyst)",
        "Frontend Developer (ReactJS/VueJS)",
        "Chuyên viên DevOps (AWS, Kubernetes)",
        "Quản lý dự án CNTT (Project Manager)",
        "Tester/QA Engineer (Automation)",
        "Chuyên gia bảo mật thông tin (Security Engineer)",
        "Kỹ sư AI/Machine Learning",
        "System Admin / Network Engineer",
        "Mobile App Developer (iOS/Android)",
        "Lập trình viên Node.js / Express",
        "Chuyên viên UI/UX Designer",
        "Lập trình viên C# / .NET Developer",
        "Kỹ sư cầu nối (BrSE) - Tiếng Nhật",
        "Lập trình viên Python (Django/Flask)",
        "Golang Developer (Microservices)",
        "Blockchain Developer / Smart Contract",
        "Data Scientist / Data Engineer",
        "Product Manager / Product Owner",
        "IT Support / Helpdesk"
    };

    String[] benefits = {
        "Mức lương vô cùng hấp dẫn (thỏa thuận theo năng lực), xét tăng lương định kỳ 2 lần/năm.",
        "Thưởng tháng 13, thưởng dự án, thưởng năng suất và các dịp Lễ Tết lớn trong năm.",
        "Được đài thọ tham gia các khóa đào tạo chuyên sâu về kỹ năng và công nghệ để phát triển bản thân.",
        "Môi trường làm việc trẻ trung, năng động, văn phòng hiện đại có khu vực giải trí và đồ ăn vặt miễn phí.",
        "Bảo hiểm sức khỏe cao cấp cho nhân viên và người thân (Bảo Việt/PVI).",
        "Thời gian làm việc linh hoạt, cho phép làm việc từ xa (remote/hybrid) 2-3 ngày/tuần.",
        "Cơ hội được đi công tác nước ngoài (Mỹ, Châu Âu, Nhật Bản, Singapore) thường xuyên.",
        "Được cung cấp Macbook Pro đời mới và các thiết bị làm việc hiện đại nhất."
    };

    List<Job> jobs = new ArrayList<>();
    for (int i = 0; i < 150; i++) {
      Job job = new Job();
      String title = jobTitles[random.nextInt(jobTitles.length)]
          + (random.nextBoolean() ? " (Senior)" : " (Junior/Middle)");
      job.setName(title);
      job.setLocation(random.nextBoolean() ? "TP. Hồ Chí Minh"
          : (random.nextBoolean() ? "Hà Nội" : "Đà Nẵng"));
      job.setSalary(random.nextInt(4000) + 800);
      job.setQuantity(random.nextInt(10) + 1);
      job.setLevel(LevelEnum.values()[random.nextInt(LevelEnum.values().length)]);

      // Generate HTML detailed description
      String b1 = benefits[random.nextInt(benefits.length)];
      String b2 = benefits[random.nextInt(benefits.length)];
      String b3 = benefits[random.nextInt(benefits.length)];
      if (b1.equals(b2)) b2 = benefits[0];
      if (b2.equals(b3)) b3 = benefits[1];

      String htmlDescription =
          "<p><strong>Mô tả công việc:</strong></p>"
          + "<ul>"
          + "<li>Tham gia phát triển và bảo trì các dự án trọng điểm của công ty. Phục vụ hàng triệu người dùng.</li>"
          + "<li>Phân tích yêu cầu, thiết kế kiến trúc hệ thống và cơ sở dữ liệu dựa trên các tài liệu kỹ thuật của khách hàng.</li>"
          + "<li>Viết code chất lượng cao, dễ bảo trì (clean code) và thực hiện review code chéo.</li>"
          + "<li>Đề xuất các giải pháp kỹ thuật, áp dụng công nghệ mới để tối ưu hóa hiệu năng hệ thống.</li>"
          + "<li>Phối hợp cùng các thành viên trong team Agile/Scrum (QA, BA, PM) để vận hành dự án trơn tru.</li>"
          + "</ul>"
          + "<p><strong>Yêu cầu ứng viên:</strong></p>"
          + "<ul>"
          + "<li>Có ít nhất 1-3 năm kinh nghiệm thực tế tại vị trí tương đương.</li>"
          + "<li>Nắm vững các kiến thức cơ bản về cấu trúc dữ liệu, giải thuật, OOP và Design Patterns.</li>"
          + "<li>Thành thạo ít nhất 1-2 ngôn ngữ lập trình và các Framework liên quan.</li>"
          + "<li>Sử dụng thành thạo Git, các công cụ CI/CD, có kiến thức cơ bản về Server/Cloud là một lợi thế.</li>"
          + "<li>Kỹ năng giao tiếp tốt, đọc hiểu tài liệu chuyên ngành bằng tiếng Anh.</li>"
          + "<li>Thái độ cầu tiến, chủ động trong công việc và sẵn sàng đối mặt với thử thách mới.</li>"
          + "</ul>"
          + "<p><strong>Quyền lợi:</strong></p>"
          + "<ul>"
          + "<li>" + b1 + "</li>"
          + "<li>" + b2 + "</li>"
          + "<li>" + b3 + "</li>"
          + "</ul>"
          + "<p><em>Hãy ứng tuyển ngay hôm nay để gia nhập vào đội ngũ kỹ sư tài năng của chúng tôi!</em></p>";

      job.setDescription(htmlDescription);

      Instant startDate = Instant.now().minus(random.nextInt(15), ChronoUnit.DAYS);
      Instant endDate = startDate.plus(random.nextInt(60) + 30, ChronoUnit.DAYS);
      job.setStartDate(startDate);
      job.setEndDate(endDate);
      job.setActive(endDate.isAfter(Instant.now()));

      job.setCompany(companies.get(random.nextInt(companies.size())));

      List<Skill> jobSkills = new ArrayList<>();
      int numSkills = random.nextInt(4) + 2;
      for (int j = 0; j < numSkills; j++) {
        Skill s = skills.get(random.nextInt(skills.size()));
        if (!jobSkills.contains(s)) {
          jobSkills.add(s);
        }
      }
      job.setSkills(jobSkills);

      job.setCreatedBy("system");
      job.setCreatedAt(Instant.now());
      jobs.add(job);
    }
    jobs = jobRepository.saveAll(jobs);
    System.out.println(">>> Seeded " + jobs.size() + " Jobs");

    // 6. Seed Resumes
    List<Resume> resumes = new ArrayList<>();
    for (int i = 0; i < 200; i++) {
      Resume r = new Resume();
      r.setEmail(faker.internet().emailAddress());
      r.setUrl("https://example.com/resume/" + faker.internet().uuid() + ".pdf");
      r.setStatus(ResumeStateEnum.values()[random.nextInt(ResumeStateEnum.values().length)]);

      r.setUser(candidates.get(random.nextInt(candidates.size())));
      r.setJob(jobs.get(random.nextInt(jobs.size())));

      r.setCreatedBy("system");
      r.setCreatedAt(Instant.now());
      resumes.add(r);
    }
    resumeRepository.saveAll(resumes);
    System.out.println(">>> Seeded " + resumes.size() + " Resumes");

    System.out.println(">>> END SEEDING RICH DATA...");
  }
}
