package vn.tronghm.jobhunter.domain.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
public class ResultPaginationDTO {
    private Meta meta;
    private Object result;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Meta{
        private int page;
        private int pageSize;
        private int pages;
        private long total;
    }
}
