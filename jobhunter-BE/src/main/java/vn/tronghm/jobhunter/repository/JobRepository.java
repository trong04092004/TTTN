package vn.tronghm.jobhunter.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tronghm.jobhunter.domain.Job;
import vn.tronghm.jobhunter.domain.Skill;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>,
    JpaSpecificationExecutor<Job> {
  List<Job> findBySkillsIn(List<Skill> skills);

  List<Job> findByActiveTrue();

  // Nạp sẵn skills (LAZY) để build text cho reindex ngoài transaction, tránh LazyInitializationException.
  @Query("SELECT DISTINCT j FROM Job j LEFT JOIN FETCH j.skills WHERE j.active = true")
  List<Job> findActiveWithSkills();

  // Tìm job active theo slot (skill/location/company), mỗi tham số có thể null.
  @Query("SELECT DISTINCT j FROM Job j LEFT JOIN j.skills s WHERE j.active = true "
      + "AND (:skill IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :skill, '%'))) "
      + "AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) "
      + "AND (:company IS NULL OR LOWER(j.company.name) LIKE LOWER(CONCAT('%', :company, '%')))")
  List<Job> searchActive(@Param("skill") String skill,
      @Param("location") String location,
      @Param("company") String company);
}

