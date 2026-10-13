package com.paperlessfamily.repository;

import com.paperlessfamily.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByFamilyId(Long familyId);

    List<Document> findByFamilyIdAndCategory(Long familyId, String category);

    List<Document> findByFamilyIdAndOwnerId(Long familyId, Long ownerId);

    List<Document> findByFamilyIdOrderByUploadedAtDesc(Long familyId);

    @Query("SELECT d FROM Document d WHERE d.family.id = :familyId AND " +
           "(LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.category) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Document> searchDocuments(@Param("familyId") Long familyId, @Param("query") String query);

    @Query("SELECT d FROM Document d WHERE d.family.id = :familyId AND d.expiryDate IS NOT NULL AND d.expiryDate <= :date")
    List<Document> findExpiringDocuments(@Param("familyId") Long familyId, @Param("date") LocalDate date);

    long countByFamilyId(Long familyId);
}
