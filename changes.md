# testing

2025-03-10

## Changes

- [FIXED]
  - **REGISTRY FETCHER**
      - FETCHERS & CHECK : - Auditree configuration org.registry.vulnerability.fetch_scan_engines will not be a supported, going forward. Auditree will always run using the default config ['ibm_va', 'prisma_cloud'] ( : PR https://github.ibm.com/auditree/auditree-central/pull/4037 ) (Issue [#4081](https://github.ibm.com/auditree/auditree-central/issues/4081) : PR #4037)

- [ADDED]
  - **KEY PROTECT**
      - FETCHERS : - Added a new provider [Key Protect] dfhihsdiofh(https://github.ibm.com/auditree/auditree-central/blob/master/auditree_central/provider/keyprotect/README.md#key-protect-provider-library) with fetchers KeyProtectInstanceFetcher and KeyProtectKeysFetcher  (Issue [#4031](https://github.ibm.com/auditree/auditree-central/issues/4031) : PR #4041)
      - FETCHERS : - Added ICLAlertsFetcher to fetch all required cloud logs alert configurations. This fetcher will replace ActivityTrackerAlertsFetcher (deprecated)  (Issue [#4029](https://github.ibm.com/auditree/auditree-central/issues/4029) : PR #4069)
  - **General**
      - Other : - Auditree configuration org.registry.vulnerability.fetch_scan_engines will not be a supported, going forward. Auditree will always run using the default config ['ibm_va', 'prisma_cloud'] ( : PR https://github.ibm.com/auditree/auditree-central/pull/4037 ) (Issue [#4081](https://github.ibm.com/auditree/auditree-central/issues/4081) : PR #4037)
  - **HPCS**
      - FETCHERS : - Added a new provider [HPCS](https://github.ibm.com/auditree/auditree-central/blob/master/auditree_central/provider/hpcs/README.md#hyper-protect-crypto-services-hpcs-provider-library) with fetchers HPCSInstanceFetcher and HPCSKeysFetcher ( : PR https://github.ibm.com/auditree/auditree-central/pull/4078) (Issue [#4032](https://github.ibm.com/auditree/auditree-central/issues/4032) : PR #4078)

---