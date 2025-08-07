# Production Kubernetes deployment with RSA keys secret management

apiVersion: apps/v1
kind: Deployment
metadata:
  name: node-template-api
  labels:
    app: node-template
    component: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: node-template
      component: api
  template:
    metadata:
      labels:
        app: node-template
        component: api
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        runAsGroup: 1001
        fsGroup: 1001
      containers:
      - name: node-template-api
        image: node-template:latest
        imagePullPolicy: Always
        securityContext:
          allowPrivilegeEscalation: false
          capabilities:
            drop:
              - ALL
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "8080"
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        volumeMounts:
        - name: rsa-keys
          mountPath: /app/keys
          readOnly: true
        - name: logs
          mountPath: /app/logs
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        startupProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 6
      volumes:
      - name: rsa-keys
        secret:
          secretName: rsa-keys
          defaultMode: 0400
          items:
          - key: private-key
            path: private.pem
            mode: 0400
          - key: public-key
            path: public.pem
            mode: 0444
      - name: logs
        emptyDir:
          sizeLimit: 1Gi
      restartPolicy: Always
      terminationGracePeriodSeconds: 30

---
apiVersion: v1
kind: Service
metadata:
  name: node-template-api-service
  labels:
    app: node-template
    component: api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: node-template
    component: api
