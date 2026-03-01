package com.proxima.mobile;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Register native plugins before super.onCreate() so Capacitor picks them up
        registerPlugin(ARPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
