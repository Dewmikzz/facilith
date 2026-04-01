package com.smartcampus.models;

import java.util.Date;

public class Booking {
    private String id;
    private String userId;
    private String resourceId;
    private Date startTime;
    private Date endTime;
    private String status; // PENDING, APPROVED, REJECTED, CANCELLED
    private String purpose;
    private int attendeeCount;
    private String qrCodeUrl;

    public Booking() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public Date getStartTime() { return startTime; }
    public void setStartTime(Date startTime) { this.startTime = startTime; }
    public Date getEndTime() { return endTime; }
    public void setEndTime(Date endTime) { this.endTime = endTime; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public int getAttendeeCount() { return attendeeCount; }
    public void setAttendeeCount(int attendeeCount) { this.attendeeCount = attendeeCount; }
    public String getQrCodeUrl() { return qrCodeUrl; }
    public void setQrCodeUrl(String qrCodeUrl) { this.qrCodeUrl = qrCodeUrl; }
}
