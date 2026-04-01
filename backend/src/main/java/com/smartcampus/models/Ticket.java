package com.smartcampus.models;

import java.util.Date;
import java.util.List;

public class Ticket {
    private String id;
    private String reporterId;
    private String technicianId;
    private String resourceId;
    private String title;
    private String description;
    private String priority; // LOW, MEDIUM, HIGH, URGENT
    private String status; // OPEN, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    private List<String> imageUrls;
    private String resolutionImageUrl;
    private Date slaDeadline;
    private Date createdAt;

    public Ticket() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getReporterId() { return reporterId; }
    public void setReporterId(String reporterId) { this.reporterId = reporterId; }
    public String getTechnicianId() { return technicianId; }
    public void setTechnicianId(String technicianId) { this.technicianId = technicianId; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public Date getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(Date slaDeadline) { this.slaDeadline = slaDeadline; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
    public String getResolutionImageUrl() { return resolutionImageUrl; }
    public void setResolutionImageUrl(String resolutionImageUrl) { this.resolutionImageUrl = resolutionImageUrl; }
}
