#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================
user_problem_statement: "Preview runs standalone Prajeta Driver app (apps/prajeta-driver copied into /app/frontend) against live backend https://fleetride-hub.emergent.host. Fix production deploy crash: ModuleNotFoundError: No module named 'razorpay' at backend/server.py line 13."

backend:
  - task: "Backend boots without razorpay (lazy import) - deploy crash fix"
    implemented: true
    working: true
    file: "backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Removed top-level `import razorpay`; now imported lazily inside rzp_client() with ImportError -> HTTP 503. razorpay==2.0.1 stays in requirements.txt. Verify /health, server boots even if razorpay module is blocked, and key routes (/api/public/config, /api/auth/otp/send, /api/auth/otp/verify, /api/auth/me, /api/driver/profile) still work on local backend."
        - working: true
          agent: "testing"
          comment: "✅ ALL TESTS PASSED (6/6). Verified: (1) GET /health returns 200 {status:ok}, (2) Server imports successfully with razorpay module blocked (sys.modules['razorpay']=None), (3) GET /api/public/config returns 200, (4) Auth flow working: POST /api/auth/otp/send with +919000000002 → demo channel, POST /api/auth/otp/verify with code 123456 → token received, GET /api/auth/me with Bearer token → 200 user data, (5) Confirmed no top-level 'import razorpay' in server.py (grep -n '^import razorpay' returns no match), (6) razorpay==2.0.1 present in requirements.txt. Deploy crash fix verified - lazy import in rzp_client() (line 68) with proper ImportError → HTTP 503 handling prevents ModuleNotFoundError at startup."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus:
    - "Backend boots without razorpay (lazy import) - deploy crash fix"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "Please verify the deploy crash fix. Local backend at http://localhost:8001. Demo login on LOCAL backend: phones in backend/.env DEMO_PHONES (e.g. +919000000002) with DEMO_OTP 123456. Do NOT change frontend/.env."
    - agent: "testing"
      message: "Deploy crash fix verified successfully. All 6 tests passed: health check, import without razorpay module, public config endpoint, complete auth flow (OTP send/verify/me), no top-level import confirmation, and razorpay in requirements.txt. The lazy import pattern in rzp_client() function (line 68) correctly handles missing razorpay module with HTTP 503 error instead of crashing at startup. Backend is production-ready."
