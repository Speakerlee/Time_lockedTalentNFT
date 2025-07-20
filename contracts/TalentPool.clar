;; Time-Locked Talent NFT
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; 

;; Define the NFT
(define-non-fungible-token talent-nft uint)

;; Data variables
(define-data-var next-id uint u1)
(define-data-var contract-owner principal tx-sender)

;; Data maps
(define-map nft-owner-map
  uint
  {
    owner: principal,
    unlock: uint,
  }
)

;; Error constants
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-NOT-UNLOCKED (err u101))
(define-constant ERR-NOT-FOUND (err u102))
(define-constant ERR-NOT-AUTHORIZED (err u103))
(define-constant ERR-MINT-FAILED (err u105))
(define-constant ERR-TRANSFER-FAILED (err u106))

;; Public functions

;; Mint a time-locked NFT
(define-public (mint-time-locked-nft
    (recipient principal)
    (unlock-block uint)
  )
  (let ((id (var-get next-id)))
    (begin
      (try! (nft-mint? talent-nft id recipient))
      (map-set nft-owner-map id {
        owner: recipient,
        unlock: unlock-block,
      })
      (var-set next-id (+ id u1))
      (ok id)
    )
  )
)

;; Transfer an NFT (only if unlocked and sender is owner)
(define-public (transfer-talent-nft
    (id uint)
    (sender principal)
    (recipient principal)
  )
  (let ((info (unwrap! (map-get? nft-owner-map id) ERR-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender sender) ERR-NOT-OWNER)
      (asserts! (is-eq sender (get owner info)) ERR-NOT-OWNER)
      (asserts! (>= stacks-block-height (get unlock info)) ERR-NOT-UNLOCKED)
      (try! (nft-transfer? talent-nft id sender recipient))
      (map-set nft-owner-map id {
        owner: recipient,
        unlock: (get unlock info),
      })
      (ok true)
    )
  )
)

;; Redeem an NFT (only if unlocked and caller is owner)
(define-public (redeem-nft (id uint))
  (let ((info (unwrap! (map-get? nft-owner-map id) ERR-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get owner info)) ERR-NOT-OWNER)
      (asserts! (>= stacks-block-height (get unlock info)) ERR-NOT-UNLOCKED)
      (ok "Redeemed")
    )
  )
)

;; Admin function: Emergency unlock any NFT
(define-public (emergency-unlock (id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (let ((info (unwrap! (map-get? nft-owner-map id) ERR-NOT-FOUND)))
      (begin
        (map-set nft-owner-map id {
          owner: (get owner info),
          unlock: stacks-block-height,
        })
        (ok true)
      )
    )
  )
)

;; Admin function: Update unlock time for an NFT
(define-public (update-unlock-time
    (id uint)
    (new-unlock-block uint)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (let ((info (unwrap! (map-get? nft-owner-map id) ERR-NOT-FOUND)))
      (begin
        (map-set nft-owner-map id {
          owner: (get owner info),
          unlock: new-unlock-block,
        })
        (ok true)
      )
    )
  )
)

;; Admin function: Transfer contract ownership
(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

;; Read-only functions

;; Get NFT information
(define-read-only (get-nft-info (id uint))
  (map-get? nft-owner-map id)
)

;; Check if NFT is unlocked
(define-read-only (is-nft-unlocked (id uint))
  (match (map-get? nft-owner-map id)
    info (>= stacks-block-height (get unlock info))
    false
  )
)

;; Get contract owner
(define-read-only (get-contract-owner)
  (var-get contract-owner)
)

;; Get NFT owner
(define-read-only (get-nft-owner (id uint))
  (match (map-get? nft-owner-map id)
    info (some (get owner info))
    none
  )
)

;; Get next NFT ID
(define-read-only (get-next-id)
  (var-get next-id)
)

;; Get unlock block for specific NFT
(define-read-only (get-unlock-block (id uint))
  (match (map-get? nft-owner-map id)
    info (some (get unlock info))
    none
  )
)

;; Get last token ID
(define-read-only (get-last-token-id)
  (ok (- (var-get next-id) u1))
)

;; Get token URI (required for SIP-009)
(define-read-only (get-token-uri (id uint))
  (ok none)
)
