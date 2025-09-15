
export default function Spinner({ message }) {
    return (
      <div id="pageTransitionMessage" class="nhsuk-loader__container2 nhsuk-hidden">
        <p class="nhsuk-u-font-size-32">
        <span class="nhsuk-loader__text">{ message }</span>
        <br />
        <span class="nhsuk-loader">
          </span>
        </p>
      </div>
  )
}