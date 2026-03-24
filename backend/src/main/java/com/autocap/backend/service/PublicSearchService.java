package com.autocap.backend.service;

import com.autocap.backend.dto.PagedResponse;
import com.autocap.backend.dto.PublicCaptionSearchDto;
import com.autocap.backend.dto.PublicCaptionSearchProjection;
import com.autocap.backend.repository.CaptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PublicSearchService {

    private final CaptionRepository captionRepository;
    
    private static final String SUPABASE_STORAGE_BASE_URL = "https://mztbiewiqjnairxnurfk.supabase.co/storage/v1/object/public/Images/";

    public PagedResponse<PublicCaptionSearchDto> searchPublicCaptions(String query, Pageable pageable) {
        Page<PublicCaptionSearchProjection> projectionPage = captionRepository.searchPublicCaptions(query, pageable);
        
        Page<PublicCaptionSearchDto> dtoPage = projectionPage.map(projection -> {
            String imageUrl = null;
            if (projection.getOriginalName() != null) {
                imageUrl = SUPABASE_STORAGE_BASE_URL + projection.getOriginalName();
            }
            return PublicCaptionSearchDto.builder()
                    .captionId(projection.getCaptionId())
                    .imageId(projection.getImageId())
                    .imageUrl(imageUrl)
                    .captionText(projection.getCaptionText())
                    .similarityScore(projection.getSimilarityScore())
                    .isFlagged(projection.getIsFlagged())
                    .build();
        });
        
        return PagedResponse.from(dtoPage);
    }
}
