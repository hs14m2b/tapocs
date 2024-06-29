**Submit** a Provide Document Bundle transaction [ITI-65] containing Minimal Metadata to a Document Recipient
actor.

**Message contents**: Bundle resource containing a List and a DocumentReference referencing a Dynamic Document. The standard
linkage between List and DocumentReference is present.

**Metadata contents**: List and DocumentReference contain the minimum required by Minimal
 Metadata.   List.identifier and
DocumentReference.masterIdentifier are given unique values before the transaction is sent.

**Expected Outcome**: Transaction will succeed with status 200 and the contents will be persisted to the server.
