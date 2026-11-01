//
//  MetadataTagger.swift
//  Downtify iOS
//
//  Created by Henrique Sebastião & Downtify Contributors.
//  Copyright © 2026 Downtify. All rights reserved.
//

import Foundation
import AVFoundation

public struct DowntifyMetadata {
    public let title: String
    public let artist: String
    public let album: String
    public let releaseYear: String
    public let trackNumber: Int
    public let genre: String
    public let isrc: String?
    public let artworkData: Data?
}

public class MetadataTagger {
    public static let shared = MetadataTagger()
    
    public func createMetadataItems(from metadata: DowntifyMetadata) -> [AVMetadataItem] {
        var items: [AVMetadataItem] = []
        
        // Common Identifier: Title
        let titleItem = AVMutableMetadataItem()
        titleItem.identifier = .commonIdentifierTitle
        titleItem.value = metadata.title as NSString
        items.append(titleItem)
        
        // Common Identifier: Artist
        let artistItem = AVMutableMetadataItem()
        artistItem.identifier = .commonIdentifierArtist
        artistItem.value = metadata.artist as NSString
        items.append(artistItem)
        
        // Common Identifier: Album Name
        let albumItem = AVMutableMetadataItem()
        albumItem.identifier = .commonIdentifierAlbumName
        albumItem.value = metadata.album as NSString
        items.append(albumItem)
        
        // Common Identifier: Creation Date / Year
        let yearItem = AVMutableMetadataItem()
        yearItem.identifier = .commonIdentifierCreationDate
        yearItem.value = metadata.releaseYear as NSString
        items.append(yearItem)
        
        // Artwork
        if let artData = metadata.artworkData {
            let artItem = AVMutableMetadataItem()
            artItem.identifier = .commonIdentifierArtwork
            artItem.value = artData as NSData
            artItem.dataType = kCMMetadataBaseDataType_JPEG as String
            items.append(artItem)
        }
        
        return items
    }
}
