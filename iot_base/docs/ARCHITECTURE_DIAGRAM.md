# IoT Dashboard Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        IoT Dashboard                             │
│                    (Odoo 18 + Owl Framework)                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
         ┌──────▼──────┐                ┌──────▼──────┐
         │   Backend   │                │  Frontend   │
         │   (Python)  │                │ (Owl + JS)  │
         └──────┬──────┘                └──────┬──────┘
                │                               │
                │                               │
    ┌───────────┴───────────┐         ┌────────┴────────┐
    │                       │         │                  │
    │  Odoo Controllers     │         │   Static Assets  │
    │  - /iot/app          │         │   - Components   │
    │  - /iot/devices      │         │   - Widgets      │
    │                       │         │   - Services     │
    └───────────────────────┘         └──────────────────┘
```

## Frontend Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Browser (User)                              │
└────────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP Request
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Odoo Web Server                                │
│                                                                     │
│  Route: /iot/app                                                   │
│  Controller: IotAppController                                      │
│  Template: iot_base.app                                            │
│                                                                     │
│  Loads:                                                            │
│  - Odoo Core Assets                                                │
│  - Bootstrap 5                                                     │
│  - FontAwesome                                                     │
│  - MQTT.js (CDN)                                                   │
│  - IoT Base Assets (iot_base.assets_standalone_app)               │
└────────────────────────────────────────────────────────────────────┘
                                │
                                │ Asset Bundle
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Owl Application                               │
│                                                                     │
│  Entry Point: app.esm.js                                           │
│  ├── Import Root Component                                         │
│  └── Mount to document.body                                        │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Root Component                                 │
│                     (root.esm.js)                                  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  <div class="container-fluid">                           │     │
│  │    <h1>IoT Dashboard</h1>                                │     │
│  │    <MQTTSubscriber title="MQTT Topic Monitor" />         │     │
│  │  </div>                                                   │     │
│  └──────────────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────┐
│                    MQTT Subscriber Widget                           │
│               (widgets/mqtt_subscriber/)                           │
│                                                                     │
│  State:                                                            │
│  ├── topic: string                                                 │
│  ├── subscribedTopic: string                                       │
│  ├── messages: array                                               │
│  ├── brokerUrl: string                                             │
│  └── isSubscribing: boolean                                        │
│                                                                     │
│  Uses:                                                             │
│  ├── Input Component (for broker URL & topic)                     │
│  ├── Button Component (Subscribe/Unsubscribe/Clear)               │
│  └── MQTT Service (connection & messaging)                        │
└────────────────────────────────────────────────────────────────────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Input    │     │   Button    │     │    MQTT     │
│  Component  │     │  Component  │     │   Service   │
│             │     │             │     │             │
│ - Text      │     │ - Primary   │     │ - Connect   │
│ - Label     │     │ - Danger    │     │ - Subscribe │
│ - Events    │     │ - Secondary │     │ - Publish   │
│             │     │ - Loading   │     │ - Messages  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Component Hierarchy

```
Root Component
  │
  └── MQTTSubscriber Widget
       │
       ├── Input Component (Broker URL)
       │    └── <input type="text" />
       │
       ├── Input Component (Topic)
       │    └── <input type="text" />
       │
       ├── Button Component (Subscribe)
       │    └── <button class="btn-primary" />
       │
       ├── Button Component (Unsubscribe)
       │    └── <button class="btn-danger" />
       │
       ├── Button Component (Clear)
       │    └── <button class="btn-secondary" />
       │
       └── Message List
            └── Message Items (dynamic)
                 ├── Topic Badge
                 ├── Timestamp
                 └── Message Content
```

## Data Flow - MQTT Message Reception

```
┌─────────────┐
│ IoT Device  │
│  (Sensor)   │
└──────┬──────┘
       │
       │ Publish
       │ topic: "sensors/temp"
       │ payload: {"value": 25.5}
       │
       ▼
┌─────────────────────┐
│   MQTT Broker       │
│  (Mosquitto/EMQX)   │
│   Port: 1883/8883   │
└──────────┬──────────┘
           │
           │ WebSocket (ws:// or wss://)
           │
           ▼
┌────────────────────────────────────────────────────────┐
│              Browser (JavaScript)                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          MQTT Service (Singleton)                │  │
│  │                                                  │  │
│  │  1. Receives message via MQTT.js client        │  │
│  │  2. Decodes message buffer                     │  │
│  │  3. Stores in message history                  │  │
│  │  4. Calls all registered callbacks             │  │
│  └─────────────────┬────────────────────────────────┘  │
│                    │                                    │
│                    │ callback(message, topic)           │
│                    │                                    │
│  ┌─────────────────▼────────────────────────────────┐  │
│  │      MQTT Subscriber Widget                     │  │
│  │                                                  │  │
│  │  1. Callback receives message                   │  │
│  │  2. Creates message object with timestamp       │  │
│  │  3. Adds to state.messages array               │  │
│  │  4. Reactive state triggers re-render          │  │
│  └─────────────────┬────────────────────────────────┘  │
│                    │                                    │
│                    │ Owl Reactive Update                │
│                    │                                    │
│  ┌─────────────────▼────────────────────────────────┐  │
│  │            UI Update                            │  │
│  │                                                  │  │
│  │  1. New message appears at top of list         │  │
│  │  2. Formatted with timestamp                   │  │
│  │  3. JSON automatically pretty-printed          │  │
│  │  4. Smooth animation (CSS transition)          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Data Flow - MQTT Subscription

```
User Action
    │
    │ 1. Enters topic: "sensors/temp"
    │ 2. Clicks "Subscribe" button
    │
    ▼
┌─────────────────────────────────────────────┐
│      Button Component                       │
│      onClick event                          │
└─────────────────┬───────────────────────────┘
                  │
                  │ 3. Calls onSubscribe()
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   MQTT Subscriber Widget                    │
│                                             │
│   onSubscribe() {                           │
│     1. Validate topic                       │
│     2. Check connection                     │
│     3. Call MQTT Service                    │
│   }                                         │
└─────────────────┬───────────────────────────┘
                  │
                  │ 4. mqttService.subscribe(topic, callback)
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        MQTT Service                         │
│                                             │
│   async subscribe(topic, callback) {        │
│     1. Check if connected                   │
│     2. client.subscribe(topic)              │
│     3. Store callback in Map                │
│     4. Resolve promise                      │
│   }                                         │
└─────────────────┬───────────────────────────┘
                  │
                  │ 5. SUBSCRIBE packet
                  │
                  ▼
┌─────────────────────────────────────────────┐
│           MQTT Broker                       │
│                                             │
│   1. Receives SUBSCRIBE                     │
│   2. Registers subscription                 │
│   3. Sends SUBACK                          │
│   4. Forwards matching messages            │
└─────────────────┬───────────────────────────┘
                  │
                  │ 6. SUBACK confirmation
                  │
                  ▼
┌─────────────────────────────────────────────┐
│        MQTT Service                         │
│        Updates state.subscriptions          │
└─────────────────┬───────────────────────────┘
                  │
                  │ 7. Promise resolves
                  │
                  ▼
┌─────────────────────────────────────────────┐
│   MQTT Subscriber Widget                    │
│   Updates UI:                               │
│   - Shows "Subscribed to: sensors/temp"     │
│   - Changes button to "Unsubscribe"         │
│   - Ready to receive messages               │
└─────────────────────────────────────────────┘
```

## Service Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    MQTT Service (Singleton)                 │
│                                                             │
│  Properties:                                                │
│  ├── client: mqtt.Client                                   │
│  └── state: Reactive {                                     │
│       ├── connected: boolean                               │
│       ├── connecting: boolean                              │
│       ├── error: string | null                             │
│       ├── subscriptions: Map<topic, Set<callback>>         │
│       ├── messages: Array<MessageObject>                   │
│       └── maxMessages: number                              │
│      }                                                      │
│                                                             │
│  Methods:                                                   │
│  ├── connect(options): Promise<void>                       │
│  ├── disconnect(): void                                    │
│  ├── subscribe(topic, callback): Promise<void>             │
│  ├── unsubscribe(topic, callback?): void                   │
│  ├── publish(topic, message, options?): void               │
│  ├── getMessages(topic?): Array<MessageObject>             │
│  ├── clearMessages(topic?): void                           │
│  └── _handleMessage(topic, buffer): void (private)         │
│                                                             │
│  Event Handlers:                                            │
│  ├── on('connect'): Update state                           │
│  ├── on('error'): Store error, update state                │
│  ├── on('close'): Update connection state                  │
│  ├── on('message'): Call _handleMessage                    │
│  └── on('reconnect'): Update connecting state              │
└────────────────────────────────────────────────────────────┘
                              │
                              │ Used by
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌──────────────────┐                    ┌──────────────────┐
│ MQTT Subscriber  │                    │  Future Widgets  │
│     Widget       │                    │  - Sensor Status │
│                  │                    │  - Device Control│
│  - Subscribe     │                    │  - Charts        │
│  - Display msgs  │                    │  - Camera Feed   │
└──────────────────┘                    └──────────────────┘
```

## State Management

```
┌────────────────────────────────────────────────────────────┐
│                      Application State                      │
└────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
    ┌───────────────────┐       ┌───────────────────┐
    │   Local State     │       │   Shared State    │
    │   (Component)     │       │   (Service)       │
    └───────────────────┘       └───────────────────┘
                │                           │
                │                           │
    ┌───────────▼───────────┐   ┌──────────▼────────────┐
    │  Widget State         │   │  MQTT Service State   │
    │  (useState)           │   │  (reactive)           │
    │                       │   │                       │
    │  - topic: string      │   │  - connected: bool    │
    │  - messages: []       │   │  - subscriptions      │
    │  - brokerUrl: string  │   │  - messages: []       │
    │  - isSubscribing      │   │  - error: string      │
    └───────────────────────┘   └───────────────────────┘
                │                           │
                │                           │
                └───────────┬───────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │   Backend State       │
                │   (Odoo Database)     │
                │   (Future)            │
                │                       │
                │  - Device configs     │
                │  - User preferences   │
                │  - Historical data    │
                └───────────────────────┘
```

## File Dependencies

```
app.esm.js
  │
  ├─> root.esm.js
  │     │
  │     ├─> widgets/mqtt_subscriber/mqtt_subscriber.js
  │     │     │
  │     │     ├─> components/input/input.js
  │     │     │     └─> components/input/input.xml
  │     │     │
  │     │     ├─> components/button/button.js
  │     │     │     └─> components/button/button.xml
  │     │     │
  │     │     ├─> services/mqtt_service.js
  │     │     │     └─> (MQTT.js from CDN)
  │     │     │
  │     │     ├─> widgets/mqtt_subscriber/mqtt_subscriber.xml
  │     │     └─> widgets/mqtt_subscriber/mqtt_subscriber.scss
  │     │
  │     └─> root.xml
  │
  └─> @odoo/owl (Owl Framework)
        ├─> Component
        ├─> useState
        ├─> reactive
        ├─> onWillStart
        ├─> onMounted
        └─> onWillDestroy
```

## Communication Patterns

```
┌────────────────────────────────────────────────────────────┐
│                  Communication Patterns                     │
└────────────────────────────────────────────────────────────┘

1. Parent → Child (Props)
   ─────────────────────
   Root ───[props]───> MQTTSubscriber ───[props]───> Input
                                      └──[props]───> Button

2. Child → Parent (Events)
   ──────────────────────
   Input ───[onChange]───> MQTTSubscriber
   Button ───[onClick]───> MQTTSubscriber

3. Component ↔ Service (Direct Access)
   ────────────────────────────────────
   MQTTSubscriber <───[calls]───> MQTT Service
                  ───[state]───>

4. Service ↔ External (WebSocket)
   ──────────────────────────────
   MQTT Service <───[ws://]───> MQTT Broker <───> IoT Devices

5. Reactive State Updates
   ──────────────────────
   Service State Change ───> Automatic Re-render ───> UI Update
```

## Deployment Flow

```
┌─────────────┐
│ Development │
│   Machine   │
└──────┬──────┘
       │
       │ 1. Code Changes
       │
       ▼
┌──────────────────┐
│  Git Repository  │
│  (Version Ctrl)  │
└──────┬───────────┘
       │
       │ 2. git push
       │
       ▼
┌──────────────────┐
│  Odoo Server     │
│                  │
│  1. Update code  │
│  2. ./odoo-bin   │
│     -u iot_base  │
└──────┬───────────┘
       │
       │ 3. Asset Compilation
       │
       ▼
┌──────────────────────────┐
│  Compiled Asset Bundle   │
│  - JavaScript minified   │
│  - CSS processed         │
│  - Templates combined    │
└──────┬───────────────────┘
       │
       │ 4. Serve to Browser
       │
       ▼
┌─────────────────────┐
│   End User Browser  │
│   /iot/app          │
│                     │
│   ✓ Dashboard       │
│   ✓ MQTT Client     │
│   ✓ Real-time Data  │
└─────────────────────┘
```

---

**Document Version**: 1.0 **Last Updated**: 2025-10-09 **Purpose**: Visual reference for
IoT Dashboard architecture
