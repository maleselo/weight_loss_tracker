package com.healthdashboard.app;

import android.os.Bundle;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

/** Privacy policy / rationale required by Health Connect (Android 13–14+). */
public class PermissionsRationaleActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        ScrollView scroll = new ScrollView(this);
        TextView text = new TextView(this);
        text.setText(getString(R.string.health_connect_privacy_policy));
        text.setPadding(48, 48, 48, 48);
        text.setTextSize(16f);
        scroll.addView(text);
        setContentView(scroll);
        setTitle(R.string.health_connect_privacy_title);
    }
}
