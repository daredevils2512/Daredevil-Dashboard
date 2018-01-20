# Daredevil Dashboard
The logging mechanism on the backend must NOT be modifiable from outside of the robot for security reasons. Do not remove the localhost checks.

## How To Use
### Testing Enviornment
Load the `app/dashboard.html` file in your browser and use `?testing` at the end of the URL. This will force the dashboard to connect to a `localhost` instance of the backend server. In this situation, you are able to be either the dashboard or the robot due to the setup.

### Real World
Load the `app/dashboard.html` file in your browser. It should automatically connect to the robot.
