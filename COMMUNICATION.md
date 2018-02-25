At the moment the communication from the robot code to the dashboard nodejs server is rather straight forward.

# Port Rules
```

R66. Communication between the ROBOT and the OPERATOR CONSOLE is restricted as follows:
A. Network Ports:
HTTP 80: Camera connected via switch on the ROBOT, bi-directional
HTTP 443: Camera connected via switch on the ROBOT, bi-directional
UDP/TCP 554: Real-Time Streaming Protocol for h.264 camera streaming, bi-directional
UDP 1130: Dashboard-to-ROBOT control data, uni-directional
UDP 1140: ROBOT-to-Dashboard status data, uni-directional
UDP/TCP 1180-1190: Camera data from the roboRIO to the Driver Station (DS) when the camera is connected the roboRIO via USB, bi-directional.
TCP 1735: SmartDashboard, bi-directional
UDP/TCP 5800-5810: Team Use, bi-directional
Teams may use these ports as they wish if they do not employ them as outlined above (i.e. TCP 1180 can be used to pass data back and forth between the ROBOT and the DS if the Team chooses not to use the camera on USB).
```
# Protocol

A packet is suffixed, at the time of writing, with a `:2512:`.

## Packet Types

### Data Update Packet
`["driverstation.enabled",true]:2512:`

Contains a JSON array with 2 values, the "key" and then the value to set it to.


### Ping Packet
`ping:2512:`

Simply used by the robot to check its current connection state. We don't need to do anything with this since we don't really care if the robot code is alive or not (currently, at least), more-so the data we're receiving

## NYI Packet Types
A lot of these are maybe-i'll-do-this kinda things.

### Revised Data Packet
`:Data:"driverstation.enabled",true:2512:`

Now with a clear prefix and less characters overall.

### Event Data Packet
`:Event:EVENT_NAME_GOES_HERE:2512:`

Fire an event, like robot disable or estop.

Ideally we can handle this kind of stuff on the server side from just the data we're receiving since most of it is like that in the first place, but just in case...
