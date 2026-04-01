package com.smartcampus.models;

public class Resource {
    private String id;
    private String name;
    private String type; // ROOM, LAB, EQUIPMENT
    private int capacity;
    private String location;
    private String category; // Computing, Engineering, Arts, Business, Science, Sports, General
    private String status; // ACTIVE, OUT_OF_SERVICE

    public Resource() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
