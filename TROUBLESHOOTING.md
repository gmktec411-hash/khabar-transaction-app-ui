# Troubleshooting Guide - FinΞsthétique Transactions App

## Issue: Loading Data Takes Too Long

### Symptoms
- Request URL: `https://khabarayoapi.ngrok.io/khabar/transactions/v2/latest?adminId=sammy&limit=100`
- Request Method: GET
- Status: Pending/Loading

### Possible Causes & Solutions

#### 1. Backend Server Not Running
**Check**: Is the Java Spring Boot backend running?

```bash
# Navigate to backend directory
cd C:\Users\Sam\Projects\UI_API\khabar_api

# Check if server is running
# Look for "Started Application" message
```

**Solution**: Start the backend server if not running:
```bash
mvn spring-boot:run
# OR
java -jar target/khabar-api.jar
```

---

#### 2. Database Connection Issues
**Check**: Is the database connected and accessible?

**Solution**: Verify database configuration in `application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/your_database
spring.datasource.username=your_username
spring.datasource.password=your_password
```

Test database connection and check if indexes were created:
```sql
SHOW INDEX FROM TransactionRecord;
```

Expected indexes:
- `idx_transaction_admin_id`
- `idx_transaction_admin_id_id`
- `idx_transaction_admin_sent_at` ← NEW
- `idx_transaction_sent_at` ← NEW

---

#### 3. Ngrok Tunnel Expired or Not Running
**Check**: Is ngrok tunnel active?

```bash
# Check ngrok status
# Visit: http://localhost:4040
# OR check if tunnel is listed
ngrok tunnels
```

**Solution**: Restart ngrok if needed:
```bash
# For backend API
ngrok http 8080

# For Outlook API (if needed)
ngrok http 8081
```

**Update URLs** in [public/config.js](public/config.js) or environment variables with new ngrok URL.

---

#### 4. CORS Configuration Issue
**Check**: Are CORS errors showing in browser console?

**Expected**: The controller has `@CrossOrigin(origins = "*")` which should allow all origins.

**Solution**: If CORS errors persist, add explicit CORS configuration:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

---

#### 5. Large Dataset Causing Slow Query
**Check**: How many transactions exist for `adminId=sammy`?

```sql
SELECT COUNT(*) FROM TransactionRecord WHERE admin_id = 'sammy';
```

**Solution**:
- The `/v2/latest` endpoint should be fast (< 500ms) even with large datasets
- Verify database indexes exist (see #2)
- Check query execution plan:

```sql
EXPLAIN SELECT * FROM TransactionRecord
WHERE LOWER(admin_id) = LOWER('sammy')
ORDER BY id DESC
LIMIT 100;
```

Should show index usage: `idx_transaction_admin_id_id`

---

#### 6. Cache Not Initialized
**Check**: Is Spring Cache enabled?

**Solution**: Verify cache configuration in main application class:

```java
@SpringBootApplication
@EnableCaching  // ← Should be present
public class KhabarApplication {
    // ...
}
```

---

#### 7. Network Latency (Ngrok)
**Issue**: Ngrok adds latency (~100-500ms per request)

**Solution for Development**:
Update [src/config/appConfig.js](src/config/appConfig.js) to use localhost directly:

```javascript
API_BASE_URL: "http://localhost:8080",
```

Update [public/config.js](public/config.js):
```javascript
window._env_ = {
  API_BASE_URL: "http://localhost:8080",
  OUTLOOK_API_BASE_URL: "http://localhost:8081"
};
```

**Note**: This only works when both frontend and backend are on the same machine.

---

## Quick Diagnostic Steps

### Step 1: Test Backend API Directly
Open browser or use curl:
```bash
curl "https://khabarayoapi.ngrok.io/khabar/transactions/v2/latest?adminId=sammy&limit=100"
```

**Expected Response**: JSON array with up to 100 transactions in < 1 second

---

### Step 2: Check Browser Console
Open Developer Tools (F12) → Console tab

**Look for**:
- Red error messages (CORS, network, etc.)
- Yellow warnings
- API request timing in Network tab

---

### Step 3: Check Network Tab
Developer Tools (F12) → Network tab

**For the request**:
- Status: Should be `200 OK`
- Time: Should be < 2 seconds
- Response: Should show JSON data

**If pending indefinitely**:
- Backend is not responding
- Ngrok tunnel is down
- Network connectivity issue

---

### Step 4: Verify Backend Logs
Check backend console/logs for:
```
Hibernate: SELECT ... FROM TransactionRecord WHERE admin_id = ?
```

**Good signs**:
- Query executes quickly
- No errors or exceptions
- Cache hit messages (after first request)

**Bad signs**:
- Query takes > 1 second
- Database connection errors
- No logs at all (server not running)

---

## Performance Checklist

Once working, verify optimization is effective:

- [ ] Initial page load shows data in < 1 second
- [ ] "Loading latest transactions..." appears briefly
- [ ] Transaction list displays 100 latest records
- [ ] Background loading indicator appears bottom-right
- [ ] All transactions load silently in background
- [ ] No UI freeze or lag during background load
- [ ] Dashboard summary loads (if on Home page)
- [ ] Second login is instant (cached data)

---

## Common Solutions Summary

### Quick Fix #1: Restart Everything
```bash
# 1. Stop frontend (Ctrl+C in terminal)
# 2. Stop backend (Ctrl+C in terminal)
# 3. Stop ngrok (Ctrl+C in terminal)

# 4. Start backend
cd C:\Users\Sam\Projects\UI_API\khabar_api
mvn spring-boot:run

# 5. Start ngrok (new terminal)
ngrok http 8080

# 6. Update ngrok URL in config.js
# 7. Start frontend
cd C:\Users\Sam\Projects\UI_API\transactions-app
npm start
```

### Quick Fix #2: Use Localhost (No Ngrok)
Update [public/config.js](public/config.js):
```javascript
window._env_ = {
  API_BASE_URL: "http://localhost:8080",
  OUTLOOK_API_BASE_URL: "http://localhost:8081"
};
```

Restart frontend: `npm start`

### Quick Fix #3: Clear All Caches
```javascript
// In browser console (F12)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

---

## Performance Expectations

### With Optimization (Current):
- **Initial Load**: < 1 second (100 transactions)
- **Background Load**: 2-5 seconds (all data)
- **Total User Wait**: < 1 second ✅

### Without Optimization (Old):
- **Initial Load**: 5-10 seconds (all transactions)
- **Total User Wait**: 5-10 seconds ❌

---

## Contact & Support

If issues persist:
1. Check backend logs for errors
2. Verify database is accessible
3. Test API endpoints directly (curl/Postman)
4. Check ngrok tunnel status at http://localhost:4040
5. Review browser console for JavaScript errors

---

## Additional Resources

- [PERFORMANCE_OPTIMIZATION.md](PERFORMANCE_OPTIMIZATION.md) - Detailed optimization strategy
- [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md) - Implementation summary
- Backend Controller: [TransactionRecordController.java](C:\Users\Sam\Projects\UI_API\khabar_api\src\main\java\com\khabar\notifier\controller\TransactionRecordController.java)
- Optimized API: [optimizedTransactionsApi.js](src/api/optimizedTransactionsApi.js)

---

*Last Updated: December 7, 2025*
