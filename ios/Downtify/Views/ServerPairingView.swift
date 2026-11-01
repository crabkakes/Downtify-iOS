//
//  ServerPairingView.swift
//  Downtify iOS
//

import SwiftUI

struct ServerPairingView: View {
    @EnvironmentObject var apiService: DowntifyAPIService

    @State private var serverUrl = "https://downtify.local:8000"
    @State private var username = "alex"
    @State private var token = ""
    @State private var selectedTab = 0
    @State private var isSimulatingQRScan = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                // Downtify Logo
                VStack(spacing: 8) {
                    Image(systemName: "music.note.house.fill")
                        .font(.system(size: 56))
                        .foregroundColor(.emeraldGreen)
                    Text("Downtify")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                    Text("Connect to your Downtify Server")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.top, 40)

                // Pairing Selector
                Picker("Method", selection: $selectedTab) {
                    Text("Scan QR Code").tag(0)
                    Text("Manual Login").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                if selectedTab == 0 {
                    // QR Code Scanner Viewfinder
                    VStack(spacing: 16) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 24)
                                .stroke(Color.emeraldGreen, lineWidth: 2)
                                .frame(width: 240, height: 240)
                                .background(Color.black.opacity(0.4))

                            VStack {
                                Image(systemName: "qrcode.viewfinder")
                                    .font(.system(size: 72))
                                    .foregroundColor(.emeraldGreen)
                                Text("Point camera at Downtify Web\nSettings → Apps")
                                    .font(.caption)
                                    .multilineTextAlignment(.center)
                                    .foregroundColor(.gray)
                            }
                        }

                        Button {
                            // Instant simulated pairing with Downtify QR payload
                            let payload = "{\"server\":\"https://downtify.local:8000\",\"user\":\"alex\",\"token\":\"dt_sec_token_982\"}"
                            apiService.pairWithQRCode(payload)
                        } label: {
                            Text("Simulate QR Scan (Settings → Apps)")
                                .font(.footnote)
                                .fontWeight(.semibold)
                                .foregroundColor(.emeraldGreen)
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(Color.emeraldGreen.opacity(0.15))
                                .cornerRadius(20)
                        }
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    // Manual Login Form
                    VStack(spacing: 16) {
                        TextField("Server URL (e.g. https://downtify.local:8000)", text: $serverUrl)
                            .padding()
                            .background(Color(white: 0.12))
                            .cornerRadius(12)
                            .foregroundColor(.white)

                        TextField("Username", text: $username)
                            .padding()
                            .background(Color(white: 0.12))
                            .cornerRadius(12)
                            .foregroundColor(.white)

                        SecureField("Password or Auth Token", text: $token)
                            .padding()
                            .background(Color(white: 0.12))
                            .cornerRadius(12)
                            .foregroundColor(.white)

                        Button {
                            apiService.connectManually(url: serverUrl, user: username, token: token)
                        } label: {
                            Text("Connect to Server")
                                .fontWeight(.semibold)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.emeraldGreen)
                                .cornerRadius(14)
                        }
                    }
                    .padding(.horizontal)
                    .frame(maxHeight: .infinity)
                }

                // Demo Server Bypass Button
                Button {
                    apiService.connectManually(
                        url: "https://demo.downtify.internal",
                        user: "demo_user",
                        token: "demo_token"
                    )
                } label: {
                    Text("Explore with Demo Server")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
                .padding(.bottom, 20)
            }
        }
    }
}
