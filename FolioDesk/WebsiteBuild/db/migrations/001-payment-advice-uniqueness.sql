ALTER TABLE payment_advices
  ADD UNIQUE KEY uq_adv_collection_beneficiary_type
    (collection_id, beneficiary_affiliate_id, beneficiary_type);
