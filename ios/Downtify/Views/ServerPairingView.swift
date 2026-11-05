//
//  ServerPairingView.swift
//  Downtify iOS
//

import SwiftUI

struct ServerPairingView: View {
    @EnvironmentObject var apiService: DowntifyAPIService

    @State private var serverUrl = ""
    @State private var username = ""
    @State private var token = ""
    @State private var trustSelfSigned = false
    @State private var selectedTab = 0
    @State private var qrPayloadText = ""
    @State private var parseError: String? = nil

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
                    Text("Scan / Paste QR").tag(0)
                    Text("Manual Login").tag(1)
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)

                if selectedTab == 0 {
                    // QR Code Scanner / Paste View
                    ScrollView {
                        VStack(spacing: 16) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 24)
                                    .stroke(Color.emeraldGreen, lineWidth: 2)
                                    .frame(width: 200, height: 200)
                                    .background(Color.black.opacity(0.4))

                                VStack(spacing: 8) {
                                    Image(systemName: "qrcode.viewfinder")
                                        .font(.system(size: 56))
                                        .foregroundColor(.emeraldGreen)
                                    Text("Open Downtify Web\nSettings → Apps")
                                        .font(.caption2)
                                        .multilineTextAlignment(.center)
                                        .foregroundColor(.gray)
                                }
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("OR PASTE QR CODE JSON PAYLOAD")
                                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                                    .foregroundColor(.emeraldGreen)

                                TextEditor(text: $qrPayloadText)
                                    .frame(height: 70)
                                    .padding(8)
                                    .background(Color(white: 0.12))
                                    .cornerRadius(12)
                                    .foregroundColor(.white)
                                    .font(.system(size: 11, design: .monospaced))
                            }
                            .padding(.horizontal)

                            if let error = parseError {
                                Text(error)
                                    .font(.caption2)
                                    .foregroundColor(.red)
                                    .padding(.horizontal)
                            }

                            Button {
                                if !qrPayloadText.trimmingCharacters(in: .whitespaces).isEmpty {
                                    apiService.pairWithQRCode(qrPayloadText)
                                } else if let pasteboard = UIPasteboard.general.string {
                                    qrPayloadText = pasteboard
                                    apiService.pairWithQRCode(pasteboard)
                                } else {
                                    parseError = "Please paste the QR JSON code from Settings → Apps."
                                }
                            } label: {
                                Text(qrPayloadText.isEmpty ? "Paste & Pair from Clipboard" : "Connect with Payload")
                                    .font(.footnote)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.black)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 46)
                                    .background(Color.emeraldGreen)
                                    .cornerRadius(14)
                                    .padding(.horizontal)
                            }
                        }
                    }
                    .frame(maxHeight: .infinity)
                } else {
                    // Manual Login Form
                    ScrollView {
                        VStack(spacing: 14) {
                            TextField("Server URL (e.g. http://192.168.1.100:8000)", text: $serverUrl)
                                .padding()
                                .frame(minHeight: 48)
                                .background(Color(white: 0.12))
                                .cornerRadius(12)
                                .foregroundColor(.white)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)

                            TextField("Username (e.g. admin)", text: $username)
                                .padding()
                                .frame(minHeight: 48)
                                .background(Color(white: 0.12))
                                .cornerRadius(12)
                                .foregroundColor(.white)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)

                            SecureField("Password or Auth Token", text: $token)
                                .padding()
                                .frame(minHeight: 48)
                                .background(Color(white: 0.12))
                                .cornerRadius(12)
                                .foregroundColor(.white)

                            // Local TLS Options
                            Toggle("Trust Self-Signed TLS / HTTP (Home Lab)", isOn: $trustSelfSigned)
                                .font(.caption)
                                .foregroundColor(.gray)
                                .tint(.emeraldGreen)
                                .padding(12)
                                .background(Color(white: 0.10))
                                .cornerRadius(12)

                            Button {
                                guard !serverUrl.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                                apiService.connectManually(
                                    url: serverUrl,
                                    user: username,
                                    token: token,
                                    trustSelfSigned: trustSelfSigned
                                )
                            } label: {
                                Text("Connect to Server")
                                    .fontWeight(.semibold)
                                    .foregroundColor(.black)
                                    .frame(maxWidth: .infinity)
                                    .frame(minHeight: 50)
                                    .background(Color.emeraldGreen)
                                    .cornerRadius(14)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .frame(maxHeight: .infinity)
                }
            }
            .padding(.bottom, 20)
        }
    }
}
