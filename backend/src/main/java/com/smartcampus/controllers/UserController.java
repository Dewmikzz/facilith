package com.smartcampus.controllers;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.UserRecord;
import com.smartcampus.dao.UserDao;
import com.smartcampus.models.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserDao userDao;

    public UserController(UserDao userDao) {
        this.userDao = userDao;
    }

    @PostMapping("/")
    public ResponseEntity<?> createUserProfile(@RequestBody User user) {
        try {
            String timestamp = userDao.saveUser(user);
            return ResponseEntity.ok(Map.of("message", "User saved!", "timestamp", timestamp));
        } catch (InterruptedException | ExecutionException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/{uid}")
    public ResponseEntity<?> getUserProfile(@PathVariable String uid) {
        try {
            User user = userDao.getUserById(uid);
            if (user != null) return ResponseEntity.ok(user);
            return ResponseEntity.notFound().build();
        } catch (InterruptedException | ExecutionException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * Admin-only: Update a user's role in both Firestore AND Firebase Auth custom claims.
     * Custom claims update ensures the JWT token reflects the new role on next login.
     */
    @PatchMapping("/{uid}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable String uid, @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }
        try {
            // 1. Update Firestore
            userDao.updateRole(uid, newRole);

            // 2. Update Firebase Auth custom claims so next token includes new role
            Map<String, Object> claims = new HashMap<>();
            claims.put("role", newRole);
            FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);

            return ResponseEntity.ok(Map.of("message", "Role updated to " + newRole + " for user " + uid));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}
