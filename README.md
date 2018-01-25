# Daredevil Dashboard
The logging mechanism on the backend must NOT be modifiable from outside of the robot for security reasons. Do not remove the localhost checks.

## How To Use
### Testing Enviornment
- Load `app/dashboard.html?testing` in your browser and make sure to include the query at the end. 
  - This will force the dashboard to connect to a `localhost` instance of the backend server.
- Load `app/debug%20robot.html` in another tab.
  - Here you can use a Virtual Driver Station, send errors and warnings and control a Virtual FMS.

### Real World
Load the `app/dashboard.html` file in your browser. It should automatically connect to the robot.
