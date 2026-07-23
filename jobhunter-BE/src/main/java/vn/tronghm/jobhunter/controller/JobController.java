package vn.tronghm.jobhunter.controller;

import com.turkraft.springfilter.boot.Filter;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tronghm.jobhunter.domain.Job;
import vn.tronghm.jobhunter.domain.response.ResultPaginationDTO;
import vn.tronghm.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.tronghm.jobhunter.domain.response.job.ResJobSimilarDTO;
import vn.tronghm.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.tronghm.jobhunter.service.JobRecommendationService;
import vn.tronghm.jobhunter.service.JobService;
import vn.tronghm.jobhunter.util.annotation.ApiMessage;
import vn.tronghm.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
public class JobController {

  private final JobService jobService;
  private final JobRecommendationService jobRecommendationService;

  public JobController(JobService jobService,
      JobRecommendationService jobRecommendationService) {
    this.jobService = jobService;
    this.jobRecommendationService = jobRecommendationService;
  }

  @PostMapping("/jobs")
  @ApiMessage("Create a job")
  public ResponseEntity<ResCreateJobDTO> create(@Valid @RequestBody Job job) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(this.jobService.create(job));
  }

  @PutMapping("/jobs")
  @ApiMessage("Update a job")
  public ResponseEntity<ResUpdateJobDTO> update(@Valid @RequestBody Job job) throws IdInvalidException {
    Optional<Job> currentJob = this.jobService.fetchJobById(job.getId());
    if (!currentJob.isPresent()) {
      throw new IdInvalidException("Job not found");
    }

    return ResponseEntity.ok()
        .body(this.jobService.update(job, currentJob.get()));
  }

  @DeleteMapping("/jobs/{id}")
  @ApiMessage("Delete a job by id")
  public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
    Optional<Job> currentJob = this.jobService.fetchJobById(id);
    if (!currentJob.isPresent()) {
      throw new IdInvalidException("Job not found");
    }
    this.jobService.delete(id);
    return ResponseEntity.ok().body(null);
  }

  @GetMapping("/jobs/{id}")
  @ApiMessage("Get a job by id")
  public ResponseEntity<Job> getJob(@PathVariable("id") long id) throws IdInvalidException {
    Optional<Job> currentJob = this.jobService.fetchJobById(id);
    if (!currentJob.isPresent()) {
      throw new IdInvalidException("Job not found");
    }

    return ResponseEntity.ok().body(currentJob.get());
  }

  @GetMapping("/jobs")
  @ApiMessage("Get job with pagination")
  public ResponseEntity<ResultPaginationDTO> getAllJob(
      @Filter Specification<Job> spec,
      Pageable pageable) {

    return ResponseEntity.ok().body(this.jobService.fetchAll(spec, pageable));
  }

  @GetMapping("/jobs/{id}/similar")
  @ApiMessage("Get similar jobs")
  public ResponseEntity<List<ResJobSimilarDTO>> getSimilarJobs(
      @PathVariable("id") long id,
      @RequestParam(value = "limit", defaultValue = "5") int limit) throws IdInvalidException {
    Optional<Job> currentJob = this.jobService.fetchJobById(id);
    if (!currentJob.isPresent()) {
      throw new IdInvalidException("Job not found");
    }

    return ResponseEntity.ok().body(this.jobRecommendationService.findSimilarJobs(id, limit));
  }
}

