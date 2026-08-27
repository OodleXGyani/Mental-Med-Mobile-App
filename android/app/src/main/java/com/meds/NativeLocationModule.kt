package com.meds

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class NativeLocationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "NativeLocationModule"

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun getCurrentPosition(options: ReadableMap?, promise: Promise) {
        val hasFine = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        val hasCoarse = ContextCompat.checkSelfPermission(
            reactContext,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasFine && !hasCoarse) {
            promise.reject("PERMISSION_DENIED", "Location permission is not granted.")
            return
        }

        val locationManager =
            reactContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        if (locationManager == null) {
            promise.reject("UNAVAILABLE", "Location manager is not available on this device.")
            return
        }

        val highAccuracy = options?.hasKey("enableHighAccuracy") == true && options.getBoolean("enableHighAccuracy")
        val timeoutMs = if (options?.hasKey("timeout") == true) options.getInt("timeout").toLong() else 10000L

        val isGpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)
        val isNetworkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)

        if (!isGpsEnabled && !isNetworkEnabled) {
            promise.reject("LOCATION_DISABLED", "Location services are turned off. Please turn on GPS.")
            return
        }

        // Check for fresh last known location
        var bestLocation: Location? = null
        if (isGpsEnabled) {
            val loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            if (loc != null) bestLocation = loc
        }
        if (isNetworkEnabled) {
            val loc = locationManager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER)
            if (loc != null && (bestLocation == null || loc.time > bestLocation.time)) {
                bestLocation = loc
            }
        }

        val now = System.currentTimeMillis()
        if (bestLocation != null && (now - bestLocation.time) < 30000) {
            val map = Arguments.createMap().apply {
                putDouble("latitude", bestLocation.latitude)
                putDouble("longitude", bestLocation.longitude)
                putDouble("accuracy", bestLocation.accuracy.toDouble())
                putDouble("altitude", bestLocation.altitude)
                putDouble("heading", bestLocation.bearing.toDouble())
                putDouble("speed", bestLocation.speed.toDouble())
                putDouble("timestamp", bestLocation.time.toDouble())
            }
            promise.resolve(map)
            return
        }

        val provider = if (highAccuracy && isGpsEnabled) {
            LocationManager.GPS_PROVIDER
        } else if (isNetworkEnabled) {
            LocationManager.NETWORK_PROVIDER
        } else {
            LocationManager.GPS_PROVIDER
        }

        val mainHandler = Handler(Looper.getMainLooper())
        var isResolved = false

        val locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                if (isResolved) return
                isResolved = true
                try {
                    locationManager.removeUpdates(this)
                } catch (_: Exception) {}

                val map = Arguments.createMap().apply {
                    putDouble("latitude", location.latitude)
                    putDouble("longitude", location.longitude)
                    putDouble("accuracy", location.accuracy.toDouble())
                    putDouble("altitude", location.altitude)
                    putDouble("heading", location.bearing.toDouble())
                    putDouble("speed", location.speed.toDouble())
                    putDouble("timestamp", location.time.toDouble())
                }
                promise.resolve(map)
            }

            override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
            override fun onProviderEnabled(provider: String) {}
            override fun onProviderDisabled(provider: String) {}
        }

        val timeoutRunnable = Runnable {
            if (isResolved) return@Runnable
            isResolved = true
            try {
                locationManager.removeUpdates(locationListener)
            } catch (_: Exception) {}

            if (bestLocation != null) {
                val map = Arguments.createMap().apply {
                    putDouble("latitude", bestLocation.latitude)
                    putDouble("longitude", bestLocation.longitude)
                    putDouble("accuracy", bestLocation.accuracy.toDouble())
                    putDouble("altitude", bestLocation.altitude)
                    putDouble("heading", bestLocation.bearing.toDouble())
                    putDouble("speed", bestLocation.speed.toDouble())
                    putDouble("timestamp", bestLocation.time.toDouble())
                }
                promise.resolve(map)
            } else {
                promise.reject("TIMEOUT", "Location request timed out. Please check GPS connection.")
            }
        }

        mainHandler.postDelayed(timeoutRunnable, timeoutMs)

        mainHandler.post {
            try {
                locationManager.requestSingleUpdate(provider, locationListener, Looper.getMainLooper())
            } catch (e: Exception) {
                if (!isResolved) {
                    isResolved = true
                    mainHandler.removeCallbacks(timeoutRunnable)
                    if (bestLocation != null) {
                        val map = Arguments.createMap().apply {
                            putDouble("latitude", bestLocation.latitude)
                            putDouble("longitude", bestLocation.longitude)
                            putDouble("accuracy", bestLocation.accuracy.toDouble())
                            putDouble("altitude", bestLocation.altitude)
                            putDouble("heading", bestLocation.bearing.toDouble())
                            putDouble("speed", bestLocation.speed.toDouble())
                            putDouble("timestamp", bestLocation.time.toDouble())
                        }
                        promise.resolve(map)
                    } else {
                        promise.reject("ERROR", e.message ?: "Failed to request location update")
                    }
                }
            }
        }
    }
}
