package com.autocap.backend.dto;

import org.springframework.data.domain.Page;
import java.util.List;

public class PagedResponse<T> {

    private List<T> content;
    private int totalPages;
    private long totalElements;
    private int number;
    private int size;
    private boolean first;
    private boolean last;

    public PagedResponse() {}

    public static <T> PagedResponse<T> from(Page<T> page) {
        PagedResponse<T> response = new PagedResponse<>();
        response.content       = page.getContent();
        response.totalPages    = page.getTotalPages();
        response.totalElements = page.getTotalElements();
        response.number        = page.getNumber();
        response.size          = page.getSize();
        response.first         = page.isFirst();
        response.last          = page.isLast();
        return response;
    }

    public List<T> getContent()       { return content; }
    public int getTotalPages()        { return totalPages; }
    public long getTotalElements()    { return totalElements; }
    public int getNumber()            { return number; }
    public int getSize()              { return size; }
    public boolean isFirst()          { return first; }
    public boolean isLast()           { return last; }
}
