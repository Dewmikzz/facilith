package com.smartcampus.controllers;

import com.smartcampus.dao.ResourceDao;
import com.smartcampus.models.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceDao resourceDao;

    public ResourceController(ResourceDao resourceDao) {
        this.resourceDao = resourceDao;
    }

    @PostMapping("/")
    public ResponseEntity<?> createResource(@RequestBody Resource resource) {
        try {
            String docId = resourceDao.createResource(resource);
            return ResponseEntity.ok("Resource created with ID: " + docId);
        } catch (InterruptedException | ExecutionException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllResources() {
        try {
            List<Resource> resources = resourceDao.getAllResources();
            return ResponseEntity.ok(resources);
        } catch (InterruptedException | ExecutionException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}
