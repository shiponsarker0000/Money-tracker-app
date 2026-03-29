package com.example.expensetracker;

import android.content.Context;
import android.net.Uri;
import android.util.Base64;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.security.SecureRandom;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class BackupManager {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String KEY = "12345678901234567890123456789012"; // 32 bytes for AES-256
    private static final int IV_SIZE = 16;

    public static void backup(Context context, Uri destinationUri) throws Exception {
        File dbFile = context.getDatabasePath("expenses.db");
        if (!dbFile.exists()) return;

        SecretKeySpec secretKey = new SecretKeySpec(KEY.getBytes(), "AES");
        byte[] iv = new byte[IV_SIZE];
        new SecureRandom().nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, ivSpec);

        try (InputStream in = new FileInputStream(dbFile);
             OutputStream out = context.getContentResolver().openOutputStream(destinationUri)) {
            
            // Write IV first
            out.write(iv);
            
            try (CipherOutputStream cipherOut = new CipherOutputStream(out, cipher)) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    cipherOut.write(buffer, 0, bytesRead);
                }
            }
        }
    }

    public static void restore(Context context, Uri sourceUri) throws Exception {
        File dbFile = context.getDatabasePath("expenses.db");
        File tempFile = new File(dbFile.getParent(), "expenses_temp.db");

        SecretKeySpec secretKey = new SecretKeySpec(KEY.getBytes(), "AES");

        try (InputStream in = context.getContentResolver().openInputStream(sourceUri);
             OutputStream out = new FileOutputStream(tempFile)) {
            
            // Read IV first
            byte[] iv = new byte[IV_SIZE];
            if (in.read(iv) != IV_SIZE) throw new Exception("Invalid backup file");
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, ivSpec);

            try (CipherInputStream cipherIn = new CipherInputStream(in, cipher)) {
                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = cipherIn.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                }
            }
        }

        // Replace current DB with restored one
        if (tempFile.exists()) {
            if (dbFile.exists()) dbFile.delete();
            tempFile.renameTo(dbFile);
        }
    }
}
