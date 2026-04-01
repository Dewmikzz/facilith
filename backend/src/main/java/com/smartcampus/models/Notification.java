package com.smartcampus.models;

import java.util.Date;

public class Notification {
    private String id;
    private String userId;
    private String message;
    private String type; // INFO, SUCCESS, WARNING, ALERT
    private boolean readStatus;
    private String link; // optional link to the related resource/ticket/booking
    private Date createdAt;

    public Notification() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isReadStatus() { return readStatus; }
    public void setReadStatus(boolean readStatus) { this.readStatus = readStatus; }
    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }
    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
