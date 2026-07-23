package vn.tronghm.jobhunter.domain.response.job;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.tronghm.jobhunter.util.constant.LevelEnum;

/** Một job gợi ý (tương tự) kèm điểm số. */
@Getter
@Setter
public class ResJobSimilarDTO {
  private long id;
  private String name;
  private String location;
  private LevelEnum level;
  private double salary;
  private String companyName;
  private List<String> skills;

  // Điểm tổng hợp: cosine similarity + bonus location/level. Càng cao càng giống.
  private double score;
}
