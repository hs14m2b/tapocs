
export default function Hiddenform() {
    return (
      <span className="nhsuk-hidden">
        <form action="/confirmdata" method="post" className="form" id="completesubmission">
          <input id="postcodehdn" name="postcodehdn" type="hidden" />
          <input id="givennamehdn" name="givennamehdn" type="hidden" />
          <input id="familynamehdn" name="familynamehdn" type="hidden" />
          <input id="favcolourhdn" name="favcolourhdn" type="hidden" />
        </form>
    </span>
  )
}